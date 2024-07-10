const express = require("express");
const morgan = require("morgan");
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const i18nextFsBackend = require('i18next-fs-backend');
const compression = require("compression");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv").config();

i18next
  .use(i18nextFsBackend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json' // Ensure the path is correct
    },
    fallbackLng: 'en',
    preload: ['en', 'ar'],
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie']
    }
  });

const app = express();

const appError = require("./utils/appError");
const mountRoutes = require('./routes/appRoutes');
const err = require("./controllers/errControllers");

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(cors());
app.options('*', cors());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(compression());

// Apply i18next middleware
app.use(i18nextMiddleware.handle(i18next));

// Routers
mountRoutes(app);

app.all('*', (req, res, next) => {
  next(new appError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(err);

module.exports = app;
