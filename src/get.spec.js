const { createMovie, getMovieModel, getToken, getURL } = require('./test-utils');
const { req, RequestError } = require('./utils');

require('./get');

it('/get - should get a movie', async () => {
  const movieModel = getMovieModel();
  const { token } = await createMovie(movieModel);
  const { title } = movieModel;
  const url = getURL(`/movies/${title}`);
  const opts = {
    headers: {
      Authorization: token
    }
  };

  const res = await req(url, opts);

  const expected = Object.keys(movieModel).concat('id', 'createdAt', 'updatedAt').sort();
  const actual = Object.keys(res).sort();

  expect(actual).toEqual(expected);
});

it('/get - should fail on a non-existant movie', async () => {
  const token = await getToken();
  const title = 'foobarbazqux';
  const url = getURL(`/movies/${title}`);
  const opts = {
    headers: {
      Authorization: token
    }
  };

  try {
    await req(url, opts);
    throw new Error('Ruh Roh. This should never execute');
  } catch(err) {
    expect(err).toBeInstanceOf(RequestError);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Movie not found.');
  }
});