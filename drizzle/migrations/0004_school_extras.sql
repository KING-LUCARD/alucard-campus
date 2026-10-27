-- 0004: admissions handling, library/resources, timetable, term results, admin corrections.
-- Every table has RLS on. Writes that cross roles go through SECURITY DEFINER functions that check the caller's role.

-- ---------- Admissions ----------
CREATE OR REPLACE FUNCTION public.admin_review_application(app uuid, new_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NOT public.has_school_role('admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF new_status NOT IN ('submitted','reviewing','accepted','declined') THEN RAISE EXCEPTION 'Bad status'; END IF;
  UPDATE public.admission_applications SET status=new_status WHERE id=app;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'application_'||new_status,app);
END $$;

-- Turns an accepted applicant into an approved student placed in a class.
CREATE OR REPLACE FUNCTION public.admin_convert_applicant(app uuid, cls uuid, dept text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE applicant uuid; st text;
BEGIN
  IF NOT public.has_school_role('admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT user_id, status INTO applicant, st FROM public.admission_applications WHERE id=app;
  IF applicant IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF st <> 'accepted' THEN RAISE EXCEPTION 'Accept the application first'; END IF;
  IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=applicant AND role IN ('admin','principal','teacher') AND active) THEN RAISE EXCEPTION 'This account is already staff'; END IF;
  UPDATE public.profiles SET status='approved' WHERE id=applicant;
  INSERT INTO public.user_roles(user_id,role) VALUES(applicant,'student') ON CONFLICT (user_id,role) DO UPDATE SET active=true;
  INSERT INTO public.enrollments(student_id,class_id,department,status) VALUES(applicant,cls,dept,'approved') ON CONFLICT (student_id) DO UPDATE SET class_id=cls, department=dept, status='approved';
  UPDATE public.role_requests SET status='approved', reviewed_at=now() WHERE user_id=applicant AND status='pending';
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'applicant_converted',applicant);
END $$;

-- ---------- Admin corrections ----------
CREATE OR REPLACE FUNCTION public.admin_correct_grade(sub uuid, new_score numeric, new_feedback text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE maxm int;
BEGIN
  IF NOT public.has_school_role('admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT a.total_marks INTO maxm FROM public.submissions s JOIN public.assignments a ON a.id=s.assignment_id WHERE s.id=sub;
  IF maxm IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF new_score < 0 OR new_score > maxm THEN RAISE EXCEPTION 'Score must be between 0 and %', maxm; END IF;
  UPDATE public.submissions SET score=new_score, feedback=coalesce(new_feedback,'') WHERE id=sub;
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'grade_corrected',sub);
END $$;
CREATE OR REPLACE FUNCTION public.admin_update_assignment(a_id uuid, new_title text, new_instructions text, new_due timestamptz, new_marks int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NOT public.has_school_role('admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF new_marks IS NULL OR new_marks <= 0 THEN RAISE EXCEPTION 'Marks must be positive'; END IF;
  UPDATE public.assignments SET title=new_title, instructions=coalesce(new_instructions,''), due_at=new_due, total_marks=new_marks WHERE id=a_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Assignment not found'; END IF;
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'assignment_edited',a_id);
END $$;
CREATE OR REPLACE FUNCTION public.admin_delete_assignment(a_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NOT public.has_school_role('admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  DELETE FROM public.assignments WHERE id=a_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Assignment not found'; END IF;
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'assignment_deleted',a_id);
END $$;

-- ---------- Library / learning resources ----------
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  description text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'book' CHECK (kind IN ('book','notes','past_questions','other')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.resources(class_id);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
CREATE POLICY read_resources ON public.resources FOR SELECT TO authenticated USING (class_id=public.my_class() OR public.teaches_class(class_id) OR public.is_staff_reader());
CREATE POLICY add_resources ON public.resources FOR INSERT TO authenticated WITH CHECK (uploaded_by=auth.uid() AND (public.teaches_class(class_id) OR public.has_school_role('admin')));
CREATE POLICY delete_resources ON public.resources FOR DELETE TO authenticated USING ((uploaded_by=auth.uid() AND public.teaches_class(class_id)) OR public.has_school_role('admin'));

-- Private storage bucket. Files live under <class_id>/<random>-<name>, so the first folder decides who may touch them.
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('resources','resources',false, 26214400) ON CONFLICT (id) DO NOTHING;
CREATE POLICY resources_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='resources' AND ((storage.foldername(name))[1]=public.my_class()::text OR public.teaches_class(((storage.foldername(name))[1])::uuid) OR public.is_staff_reader()));
CREATE POLICY resources_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='resources' AND (public.teaches_class(((storage.foldername(name))[1])::uuid) OR public.has_school_role('admin')));
CREATE POLICY resources_remove ON storage.objects FOR DELETE TO authenticated USING (bucket_id='resources' AND (public.teaches_class(((storage.foldername(name))[1])::uuid) OR public.has_school_role('admin')));

-- ---------- Timetable ----------
CREATE TABLE public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  day smallint NOT NULL CHECK (day BETWEEN 1 AND 5),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text NOT NULL DEFAULT '',
  CHECK (end_time > start_time),
  UNIQUE (class_id, day, start_time)
);
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO authenticated;
GRANT ALL ON public.timetable_entries TO service_role;
CREATE POLICY read_timetable ON public.timetable_entries FOR SELECT TO authenticated USING (class_id=public.my_class() OR public.teaches_class(class_id) OR public.is_staff_reader());
CREATE POLICY admin_timetable_ins ON public.timetable_entries FOR INSERT TO authenticated WITH CHECK (public.has_school_role('admin'));
CREATE POLICY admin_timetable_upd ON public.timetable_entries FOR UPDATE TO authenticated USING (public.has_school_role('admin')) WITH CHECK (public.has_school_role('admin'));
CREATE POLICY admin_timetable_del ON public.timetable_entries FOR DELETE TO authenticated USING (public.has_school_role('admin'));

-- ---------- Term results and report cards ----------
CREATE TABLE public.result_sheets (
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  term smallint NOT NULL CHECK (term BETWEEN 1 AND 3),
  session text NOT NULL CHECK (session ~ '^[0-9]{4}/[0-9]{4}$'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','published')),
  reviewed_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, term, session)
);
CREATE TABLE public.term_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term smallint NOT NULL CHECK (term BETWEEN 1 AND 3),
  session text NOT NULL CHECK (session ~ '^[0-9]{4}/[0-9]{4}$'),
  ca_score numeric NOT NULL DEFAULT 0 CHECK (ca_score BETWEEN 0 AND 40),
  exam_score numeric NOT NULL DEFAULT 0 CHECK (exam_score BETWEEN 0 AND 60),
  remark text NOT NULL DEFAULT '',
  entered_by uuid NOT NULL REFERENCES public.profiles(id),
  UNIQUE (student_id, subject_id, term, session)
);
CREATE INDEX ON public.term_results(class_id, term, session);
ALTER TABLE public.result_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_results ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.result_sheets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.term_results TO authenticated;
GRANT ALL ON public.result_sheets, public.term_results TO service_role;

CREATE OR REPLACE FUNCTION public.sheet_status(c uuid, t smallint, s text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT coalesce((SELECT status FROM public.result_sheets WHERE class_id=c AND term=t AND session=s),'draft') $$;

CREATE POLICY read_sheets ON public.result_sheets FOR SELECT TO authenticated USING (class_id=public.my_class() AND status='published' OR public.teaches_class(class_id) OR public.is_staff_reader());
-- A student sees only their own results, and only once the Principal has published the sheet.
CREATE POLICY read_results ON public.term_results FOR SELECT TO authenticated USING (
  (student_id=auth.uid() AND public.has_school_role('student') AND public.sheet_status(class_id,term,session)='published')
  OR public.teaches(class_id,subject_id) OR public.is_staff_reader());
CREATE POLICY teacher_enter_results ON public.term_results FOR INSERT TO authenticated WITH CHECK (
  entered_by=auth.uid() AND public.teaches(class_id,subject_id) AND public.sheet_status(class_id,term,session)<>'published'
  AND EXISTS(SELECT 1 FROM public.enrollments e WHERE e.student_id=term_results.student_id AND e.class_id=term_results.class_id AND e.status='approved'));
CREATE POLICY teacher_edit_results ON public.term_results FOR UPDATE TO authenticated USING (
  public.teaches(class_id,subject_id) AND public.sheet_status(class_id,term,session)<>'published')
  WITH CHECK (public.teaches(class_id,subject_id) AND public.sheet_status(class_id,term,session)<>'published');

-- Teacher sends a class sheet for approval; Principal publishes or sends it back.
CREATE OR REPLACE FUNCTION public.submit_result_sheet(cls uuid, t smallint, s text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NOT (public.teaches_class(cls) OR public.has_school_role('admin')) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF public.sheet_status(cls,t,s)='published' THEN RAISE EXCEPTION 'Already published'; END IF;
  INSERT INTO public.result_sheets(class_id,term,session,status) VALUES(cls,t,s,'submitted') ON CONFLICT (class_id,term,session) DO UPDATE SET status='submitted', updated_at=now();
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'results_submitted',cls);
END $$;
CREATE OR REPLACE FUNCTION public.principal_review_sheet(cls uuid, t smallint, s text, publish boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NOT public.has_school_role('principal') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF publish AND public.sheet_status(cls,t,s)<>'submitted' THEN RAISE EXCEPTION 'Only submitted sheets can be published'; END IF;
  INSERT INTO public.result_sheets(class_id,term,session,status,reviewed_by) VALUES(cls,t,s,CASE WHEN publish THEN 'published' ELSE 'draft' END,auth.uid())
    ON CONFLICT (class_id,term,session) DO UPDATE SET status=CASE WHEN publish THEN 'published' ELSE 'draft' END, reviewed_by=auth.uid(), updated_at=now();
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),CASE WHEN publish THEN 'results_published' ELSE 'results_returned' END,cls);
END $$;

-- ---------- Function access ----------
REVOKE EXECUTE ON FUNCTION public.admin_review_application(uuid,text), public.admin_convert_applicant(uuid,uuid,text), public.admin_correct_grade(uuid,numeric,text), public.admin_update_assignment(uuid,text,text,timestamptz,int), public.admin_delete_assignment(uuid), public.submit_result_sheet(uuid,smallint,text), public.principal_review_sheet(uuid,smallint,text,boolean), public.sheet_status(uuid,smallint,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_review_application(uuid,text), public.admin_convert_applicant(uuid,uuid,text), public.admin_correct_grade(uuid,numeric,text), public.admin_update_assignment(uuid,text,text,timestamptz,int), public.admin_delete_assignment(uuid), public.submit_result_sheet(uuid,smallint,text), public.principal_review_sheet(uuid,smallint,text,boolean), public.sheet_status(uuid,smallint,text) TO authenticated;
