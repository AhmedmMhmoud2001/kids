import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStaticPage } from '../api/staticPages';

const About = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        // Assuming 'about-us' is the slug in the backend
        const response = await fetchStaticPage('about-us');
        if (response.success) {
          setPageData(response.data);
        } else {
          setError('Failed to load page content');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load page content');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500">
        </div>
      </div>
    );
  }

  // Fallback to static content if API fails or no data, 
  // currently we'll just show the dynamic content if available or error/empty.
  // But to be safe and match user expectation of "connecting", if error we might want to show nothing or an error message.
  // However, usually "About Us" fallback is good. Let's stick to the fetched content primarily.

  if (!pageData) {
    // If no data found in backend (e.g. not created yet), show default structure or empty
    // For this task, we will show the fetched content.
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-500">
        {error ? <p>Error loading content.</p> : <p>Page not found.</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8">
      <div className=" mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{pageData.title}</h1>
        <div className="max-w-7xl overflow-hidden">
          <div
            className="
                      prose 
                      prose-gray 
                      max-w-none
                      break-words
                      overflow-wrap-anywhere
                      prose-a:break-all
                      prose-pre:whitespace-pre-wrap
                    "
            dangerouslySetInnerHTML={{ __html: pageData.content }}
          />
        </div>



        <div className="mt-8">
          <Link
            to="/shop"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;

