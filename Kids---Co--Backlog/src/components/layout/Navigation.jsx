import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fetchCategories } from '../../api/categories';
import { useLanguage } from '../../context/LanguageContext';

const Navigation = () => {
  const location = useLocation();
  const { audience: contextAudience, setAudience } = useApp();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read audience from URL query params or use context
  const searchParams = new URLSearchParams(location.search);
  const urlAudience = searchParams.get('audience');
  const audience = urlAudience || contextAudience;

  useEffect(() => {
    const loadCategories = async () => {
      // Determine the effective audience
      const effectiveAudience = urlAudience || contextAudience;

      // Don't load if no audience is available
      if (!effectiveAudience) {

        return;
      }


      setLoading(true);
      try {
        const res = await fetchCategories(effectiveAudience);
        if (res.success) {
          // Map backend categories to include color and path for the UI logic
          const mappedCategories = res.data.map((cat, index) => ({
            ...cat,
            color: String(cat.slug || '').toLowerCase().includes('girl') ? 'pink' :
              String(cat.slug || '').toLowerCase().includes('boy') ? 'blue' :
                index % 2 === 0 ? 'blue' : 'pink',
            path: `/category/${cat.slug}`
          }));
          setCategories(mappedCategories);
        }
      } catch (error) {
        console.error('Error loading navigation categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [urlAudience, contextAudience]); // Depend on both URL and context audience

  const getColorClasses = (category, isActive) => {
    if (isActive) {
      return category.color === 'blue'
        ? 'text-[#63adfc] border-b-2 border-[#63adfc]'
        : 'text-[#ff92a5] border-b-2 border-[#ff92a5]';
    }

    // Default classes (Hover)
    return category.color === 'blue'
      ? 'text-gray-700 hover:text-[#63adfc] border-b-2 border-transparent hover:border-[#63adfc]'
      : 'text-gray-700 hover:text-[#ff92a5] border-b-2 border-transparent hover:border-[#ff92a5]';
  };

  if (loading && categories.length === 0) {
    return (
      <nav className="bg-white border-t hidden lg:block">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-row-reverse justify-center gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 w-20 bg-gray-100 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-t hidden lg:block">
      <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
        <ul className="flex items-center justify-center gap-8 py-4">
          {categories.map((category) => {
            // Determine the effective audience for the link
            const effectiveAudience = urlAudience || contextAudience;

            // Include audience in query param for the link
            const targetPath = `${category.path}?audience=${effectiveAudience}`;

            // Check if this category is active by comparing pathnames
            const isActive = location.pathname === category.path;



            return (
              <li key={category.id || category.path}>
                <NavLink
                  to={targetPath}
                  className={() =>
                    `font-medium transition-all duration-200 pb-1 whitespace-nowrap ${getColorClasses(category, isActive)}`
                  }
                >
                  {t(category.name)}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
