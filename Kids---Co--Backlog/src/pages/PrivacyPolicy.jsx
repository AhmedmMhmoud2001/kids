import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStaticPage } from '../api/staticPages';

const PrivacyPolicy = () => {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPage = async () => {
            try {
                setLoading(true);
                // Using 'privacy-policy' as the slug
                const response = await fetchStaticPage('privacy-policy');
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
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-gray-500 mb-8">
                    {error ? 'Error loading privacy policy.' : 'Privacy policy content is currently being updated. Please check back later.'}
                </p>
                <Link to="/" className="text-blue-500 underline">Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{pageData.title}</h1>

                <div
                    className="prose prose-blue max-w-none space-y-6 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: pageData.content }}
                />

                <div className="mt-12 pt-8 border-t">
                    <Link
                        to="/shop"
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-lg transition-colors"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
