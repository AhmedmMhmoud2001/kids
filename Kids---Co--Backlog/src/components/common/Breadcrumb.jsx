import { Link } from 'react-router-dom';

/**
 * Breadcrumb component for navigation
 */
const Breadcrumb = ({ items }) => {
  return (
    <nav className="mb-6 text-sm text-gray-500">
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className="mx-2">›</span>}
          {item.to ? (
            <Link 
              to={item.to} 
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;
