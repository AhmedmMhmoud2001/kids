const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Kids & Co API Documentation',
            version: '1.0.0',
            description: 'Full API documentation for Kids & Co E-commerce',
            contact: {
                name: 'Ahmed Mahmoud',
                email: 'ahmednewton990@gmail.com'
            },
            servers: [
                {
                    url: 'https://tovo-b.developteam.site/kids/api',
                    description: 'Production Server'
                },
                {
                    url: 'http://localhost:5000/api',
                    description: 'Local Development Server'
                }
            ]
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    // Files to search for documentation decorators
    apis: [
        './src/app.js',
        './src/routes.js',
        './src/modules/upload/upload.routes.js',
        './src/modules/categories/categories.routes.js',
        './src/modules/products/products.routes.js',
        './src/modules/auth/auth.routes.js',
        './src/modules/users/users.routes.js',
        './src/modules/orders/orders.routes.js',
        './src/modules/cart/cart.routes.js',
        './src/modules/favorites/favorites.routes.js',
        './src/modules/brands/brands.routes.js',
        './src/modules/coupons/coupons.routes.js',
        './src/modules/settings/settings.routes.js'
    ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
    swaggerUi,
    swaggerDocs
};
