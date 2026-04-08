import React, { useEffect, useState } from 'react';
import { useApi } from '../api/client';
import { CourseCard } from '../components/CourseCard';

interface CourseDto {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  total_units: number;
  completionPercent: number;
}

export const CoursesPage: React.FC = () => {
  const api = useApi();
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<CourseDto[]>('/courses');
        setCourses(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api]);

  const isImplemented = (slug: string) => slug === 'machine-learning';
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCourses = courses.filter((course) => {
    if (!normalizedQuery) return true;
    const haystack = `${course.title} ${course.slug} ${course.description ?? ''}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <div>
      <div className="mb-6">
        <p className="pill-muted mb-2 inline-block">Learning tracks</p>
        <h1 className="text-2xl font-semibold mb-1 text-slate-900 dark:text-slate-50">
          Choose your AI journey
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Start with the Machine Learning path. Other tracks unlock as the platform evolves.
        </p>
      </div>
      <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400"
        >
          Search
        </button>
      </form>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      ) : (
        <>
          {filteredCourses.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No courses found for this search.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredCourses.map((c) => (
                <CourseCard
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  slug={c.slug}
                  description={c.description}
                  totalUnits={c.total_units}
                  completionPercent={c.completionPercent}
                  isImplemented={isImplemented(c.slug)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
