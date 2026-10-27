-- Teachers can see the names of students enrolled in classes they teach.
CREATE POLICY teacher_read_student_profiles ON public.profiles FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.enrollments e WHERE e.student_id = profiles.id AND e.status = 'approved' AND public.teaches_class(e.class_id)));

-- Students can see the names of teachers assigned to their own class.
CREATE POLICY student_read_teacher_profiles ON public.profiles FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.teaching_assignments ta WHERE ta.teacher_id = profiles.id AND ta.class_id = public.my_class()));