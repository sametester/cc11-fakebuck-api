require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const morgan = require('morgan');

const notFoundMiddleware = require('./middleware/notFound');
const errorMiddleware = require('./middleware/error');

app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(notFoundMiddleware);
app.use(errorMiddleware);

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server run on port ${port}`));
