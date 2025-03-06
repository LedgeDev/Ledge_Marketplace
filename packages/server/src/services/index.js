const answers = require('./answers');
const appVersions = require('./app-versions');
const benefits = require('./benefits');
const brands = require('./brands');
const categories = require('./categories');
const events = require('./events');
const feedback = require('./feedback');
const levels = require('./levels');
const questionnaires = require('./questionnaires');
const questionClasses = require('./question-classes');
const questions = require('./questions');
const ratings = require('./ratings');
const users = require('./users');
const offers = require('./offers');
const posts = require('./posts');
const products = require('./products');
const productionSubmissions = require('./production-submissions');
const s3 = require('./s3');
const dealCodes = require('./deal-codes');
const aiChat = require('./ai-chat');
const brandsAiChat = require('./brands-ai-chat');
const autoDeploy = require('./auto-deploy');
const insights = require('./insights');
const randomLoginImages = require('./random-login-images');

// Array of services
const services = [
  answers,
  appVersions,
  benefits,
  brands,
  categories,
  events,
  feedback,
  levels,
  questionnaires,
  questionClasses,
  questions,
  ratings,
  users,
  posts,
  products,
  productionSubmissions,
  s3,
  dealCodes,
  aiChat,
  brandsAiChat,
  autoDeploy,
  insights,
  randomLoginImages,
  offers,
];

module.exports = services;
