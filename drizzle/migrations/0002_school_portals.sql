ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_role_key UNIQUE (user_id, role);

CREATE OR REPLACE FUNCTION public.has_school_role(wanted app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id=ur.user_id WHERE ur.user_id=auth.uid() AND ur.role=wanted AND ur.active AND p.status='approved') $$;

CREATE OR REPLACE FUNCTION public.create_school_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles(id,display_name,email,status) VALUES(NEW.id,left(coalesce(NEW.raw_user_meta_data->>'display_name',''),100),coalesce(NEW.email,''), CASE WHEN lower(NEW.email)='desdara247@gmail.com' THEN 'approved' ELSE 'pending' END);
  IF lower(NEW.email)='desdara247@gmail.com' THEN
    INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'admin') ON CONFLICT (user_id,role) DO UPDATE SET active=true;
  ELSIF NEW.raw_user_meta_data->>'requested_role' IN ('student','teacher') THEN
    INSERT INTO public.role_requests(user_id,requested_role) VALUES(NEW.id,(NEW.raw_user_meta_data->>'requested_role')::public.app_role);
  END IF;
  RETURN NEW;
END $$;

-- Owner admin backfill if already signed up
UPDATE public.profiles SET status='approved' WHERE lower(email)='desdara247@gmail.com';
INSERT INTO public.user_roles(user_id,role) SELECT id,'admin' FROM public.profiles WHERE lower(email)='desdara247@gmail.com' ON CONFLICT (user_id,role) DO UPDATE SET active=true;
-- Existing approved roles count as approved accounts
UPDATE public.profiles SET status='approved' WHERE id IN (SELECT user_id FROM public.user_roles WHERE active);

CREATE TABLE public.classes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, sort int NOT NULL DEFAULT 0, senior boolean NOT NULL DEFAULT false);
CREATE TABLE public.subjects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, core boolean NOT NULL DEFAULT false, department text);
CREATE TABLE public.teaching_assignments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, UNIQUE(class_id,subject_id));
CREATE TABLE public.enrollments (student_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, class_id uuid NOT NULL REFERENCES public.classes(id), department text CHECK (department IN ('Science','Commercial','Arts')), status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.assignments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, teacher_id uuid NOT NULL REFERENCES public.profiles(id), title text NOT NULL, instructions text NOT NULL DEFAULT '', due_at timestamptz NOT NULL, total_marks int NOT NULL DEFAULT 100 CHECK (total_marks > 0), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE, student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, body text NOT NULL, score numeric, feedback text NOT NULL DEFAULT '', published boolean NOT NULL DEFAULT false, submitted_at timestamptz NOT NULL DEFAULT now(), UNIQUE(assignment_id,student_id));
CREATE TABLE public.attendance (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE, student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, day date NOT NULL DEFAULT current_date, present boolean NOT NULL, recorded_by uuid NOT NULL, UNIQUE(student_id,day));
CREATE TABLE public.announcements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES public.profiles(id), class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE, title text NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON public.assignments(class_id); CREATE INDEX ON public.submissions(student_id); CREATE INDEX ON public.attendance(class_id,day); CREATE INDEX ON public.teaching_assignments(teacher_id);

GRANT SELECT ON public.classes, public.subjects TO authenticated;
GRANT SELECT ON public.teaching_assignments TO authenticated;
GRANT SELECT, INSERT ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.classes, public.subjects, public.teaching_assignments, public.enrollments, public.assignments, public.submissions, public.attendance, public.announcements TO service_role;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY; ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY; ALTER TABLE public.teaching_assignments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY; ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY; ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.teaches_class(c uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT public.has_school_role('teacher') AND EXISTS(SELECT 1 FROM public.teaching_assignments WHERE class_id=c AND teacher_id=auth.uid()) $$;
CREATE OR REPLACE FUNCTION public.teaches(c uuid, s uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT public.has_school_role('teacher') AND EXISTS(SELECT 1 FROM public.teaching_assignments WHERE class_id=c AND subject_id=s AND teacher_id=auth.uid()) $$;
CREATE OR REPLACE FUNCTION public.my_class() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT class_id FROM public.enrollments WHERE student_id=auth.uid() AND status='approved' AND public.has_school_role('student') $$;
CREATE OR REPLACE FUNCTION public.is_staff_reader() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT public.has_school_role('admin') OR public.has_school_role('principal') $$;

CREATE POLICY read_classes ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY read_subjects ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY read_teaching ON public.teaching_assignments FOR SELECT TO authenticated USING (teacher_id=auth.uid() OR public.is_staff_reader() OR class_id=public.my_class());
CREATE POLICY read_enrollment ON public.enrollments FOR SELECT TO authenticated USING (student_id=auth.uid() OR public.is_staff_reader() OR public.teaches_class(class_id));
CREATE POLICY request_enrollment ON public.enrollments FOR INSERT TO authenticated WITH CHECK (student_id=auth.uid() AND status='requested' AND public.has_school_role('student'));
CREATE POLICY read_assignments ON public.assignments FOR SELECT TO authenticated USING (class_id=public.my_class() OR public.teaches_class(class_id) OR public.is_staff_reader());
CREATE POLICY teacher_write_assign ON public.assignments FOR INSERT TO authenticated WITH CHECK (teacher_id=auth.uid() AND public.teaches(class_id,subject_id));
CREATE POLICY teacher_update_assign ON public.assignments FOR UPDATE TO authenticated USING (teacher_id=auth.uid() AND public.teaches(class_id,subject_id)) WITH CHECK (teacher_id=auth.uid() AND public.teaches(class_id,subject_id));
CREATE POLICY teacher_delete_assign ON public.assignments FOR DELETE TO authenticated USING ((teacher_id=auth.uid() AND public.teaches(class_id,subject_id)) OR public.has_school_role('admin'));
CREATE POLICY read_submissions ON public.submissions FOR SELECT TO authenticated USING (student_id=auth.uid() OR public.is_staff_reader() OR EXISTS(SELECT 1 FROM public.assignments a WHERE a.id=assignment_id AND a.teacher_id=auth.uid()));
CREATE POLICY student_submit ON public.submissions FOR INSERT TO authenticated WITH CHECK (student_id=auth.uid() AND score IS NULL AND published=false AND feedback='' AND EXISTS(SELECT 1 FROM public.assignments a WHERE a.id=assignment_id AND a.class_id=public.my_class() AND a.due_at>now()));
CREATE POLICY teacher_grade ON public.submissions FOR UPDATE TO authenticated USING (EXISTS(SELECT 1 FROM public.assignments a WHERE a.id=assignment_id AND a.teacher_id=auth.uid() AND public.teaches(a.class_id,a.subject_id))) WITH CHECK (EXISTS(SELECT 1 FROM public.assignments a WHERE a.id=assignment_id AND a.teacher_id=auth.uid()));
CREATE POLICY read_attendance ON public.attendance FOR SELECT TO authenticated USING (student_id=auth.uid() OR public.teaches_class(class_id) OR public.is_staff_reader());
CREATE POLICY take_attendance ON public.attendance FOR INSERT TO authenticated WITH CHECK (recorded_by=auth.uid() AND public.teaches_class(class_id) AND EXISTS(SELECT 1 FROM public.enrollments e WHERE e.student_id=attendance.student_id AND e.class_id=attendance.class_id AND e.status='approved'));
CREATE POLICY fix_attendance ON public.attendance FOR UPDATE TO authenticated USING (public.teaches_class(class_id)) WITH CHECK (recorded_by=auth.uid() AND public.teaches_class(class_id));
CREATE POLICY read_announcements ON public.announcements FOR SELECT TO authenticated USING (class_id IS NULL OR class_id=public.my_class() OR public.teaches_class(class_id) OR public.is_staff_reader());
CREATE POLICY post_announcement ON public.announcements FOR INSERT TO authenticated WITH CHECK (author_id=auth.uid() AND ((class_id IS NULL AND public.is_staff_reader()) OR (class_id IS NOT NULL AND (public.teaches_class(class_id) OR public.is_staff_reader()))));
CREATE POLICY delete_announcement ON public.announcements FOR DELETE TO authenticated USING (author_id=auth.uid() OR public.has_school_role('admin'));

-- Submissions: a student may only submit after the deadline check; trigger stops students editing graded fields
CREATE OR REPLACE FUNCTION public.log_grade_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NEW.assignment_id<>OLD.assignment_id OR NEW.student_id<>OLD.student_id OR NEW.body<>OLD.body THEN RAISE EXCEPTION 'Submission content cannot be changed'; END IF;
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'grade_saved',NEW.student_id); RETURN NEW; END $$;
CREATE TRIGGER submissions_grade_audit BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.log_grade_change();

-- Admin-only operations
CREATE OR REPLACE FUNCTION public.admin_set_user(target uuid, new_status text, new_role app_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NOT public.has_school_role('admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF target=auth.uid() THEN RAISE EXCEPTION 'You cannot change your own account'; END IF;
  IF new_status NOT IN ('pending','approved','rejected','suspended') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.profiles SET status=new_status WHERE id=target;
  IF new_role IS NOT NULL THEN
    UPDATE public.user_roles SET active=false WHERE user_id=target AND role<>new_role;
    INSERT INTO public.user_roles(user_id,role) VALUES(target,new_role) ON CONFLICT (user_id,role) DO UPDATE SET active=true;
  END IF;
  UPDATE public.role_requests SET status=CASE WHEN new_status='approved' THEN 'approved' ELSE 'rejected' END, reviewed_at=now() WHERE user_id=target AND status='pending' AND new_status IN ('approved','rejected');
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'user_'||new_status||coalesce(':'||new_role::text,''),target);
END $$;
CREATE OR REPLACE FUNCTION public.admin_set_enrollment(target uuid, cls uuid, dept text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NOT public.has_school_role('admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  INSERT INTO public.enrollments(student_id,class_id,department,status) VALUES(target,cls,dept,'approved') ON CONFLICT (student_id) DO UPDATE SET class_id=cls, department=dept, status='approved';
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'enrollment_set',target);
END $$;
CREATE OR REPLACE FUNCTION public.admin_assign_teacher(cls uuid, subj uuid, teacher uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
  IF NOT public.has_school_role('admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=teacher AND role='teacher' AND active) THEN RAISE EXCEPTION 'User is not a teacher'; END IF;
  INSERT INTO public.teaching_assignments(class_id,subject_id,teacher_id) VALUES(cls,subj,teacher) ON CONFLICT (class_id,subject_id) DO UPDATE SET teacher_id=teacher;
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES(auth.uid(),'teacher_assigned',teacher);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_user(uuid,text,app_role), public.admin_set_enrollment(uuid,uuid,text), public.admin_assign_teacher(uuid,uuid,uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_set_user(uuid,text,app_role), public.admin_set_enrollment(uuid,uuid,text), public.admin_assign_teacher(uuid,uuid,uuid) TO authenticated;

INSERT INTO public.classes(name,sort,senior) VALUES ('JSS1',1,false),('JSS2',2,false),('JSS3',3,false),('SS1',4,true),('SS2',5,true),('SS3',6,true) ON CONFLICT DO NOTHING;
INSERT INTO public.subjects(name,core,department) VALUES ('Mathematics',true,NULL),('English Language',true,NULL),('Basic Science',false,NULL),('Physics',false,'Science'),('Chemistry',false,'Science'),('Biology',false,'Science'),('Accounting',false,'Commercial'),('Economics',false,'Commercial'),('Commerce',false,'Commercial'),('Literature in English',false,'Arts'),('Government',false,'Arts'),('History',false,'Arts') ON CONFLICT DO NOTHING;
INSERT INTO public.announcements(author_id,class_id,title,body) SELECT id,NULL,'SAMPLE: Welcome to the new term','This is sample school-wide announcement text for testing the portals.' FROM public.profiles WHERE lower(email)='desdara247@gmail.com';