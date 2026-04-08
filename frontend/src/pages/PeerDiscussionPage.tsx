import React, { useEffect, useState } from 'react';
import { useApi } from '../api/client';
import { CourseChatPanel } from '../components/CourseChatPanel';

type CourseItem = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
};

export const PeerDiscussionPage: React.FC = () => {
  const api = useApi();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<CourseItem[]>('/courses');
        setCourses(res.data);
        if (res.data.length > 0) {
          setSelectedCourseSlug((prev) => prev || res.data[0].slug);
        }
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [api]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Peer learning</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose a course and chat with other learners in that course.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-500">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-500">No courses available.</p>
      ) : (
        <div className="space-y-4">
          <div className="max-w-sm">
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
              Select course discussion
            </label>
            <select
              value={selectedCourseSlug}
              onChange={(e) => setSelectedCourseSlug(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.slug}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          {selectedCourseSlug && (
            <CourseChatPanel
              courseSlug={selectedCourseSlug}
              courseTitle={courses.find((c) => c.slug === selectedCourseSlug)?.title ?? 'Course'}
            />
          )}
        </div>
      )}
    </div>
  );
};
