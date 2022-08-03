const express = require('express');
const got = require('got');
require('express-limiter')(
  express(),
  {
    lookup: ['connection.remoteAddress'],
    total: 100,
    expire: 1000 * 60 * 60,
    onLimitReached: (req, res, options) => {
      res.status(429).json({
        message: 'Rate limit exceeded',
      });
    }
  }
);
const router = express.Router();

const api2 = 'https://api.waifu.pics'
const api3 = 'https://rule34api.vercel.app/posts'
const api4 = 'https://api.waifu.im'

async function fetchImage(type, endpoint, response) {
  try {
    const { url } = await got(`${api2}/${type}/${endpoint}`).json();
    got
      .stream(url)
      .on("response", (response) => {
        response.headers["cache-control"] = "no-cache";
        response.headers["X-Origin-Source"] = url;
      })
      .pipe(response);
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
}

async function fetchImageWIM(customQuery, endpoint, response) {
  try {
    const url = await got(`${api4}/random/?selected_tags=${endpoint}${customQuery}`).json();
    got
      .stream(url.images[0].url)
      .on("response", (response) => {
        response.headers["cache-control"] = "no-cache";
        response.headers["X-Origin-Source"] = url.images[0].url;
      }
      ).pipe(response);
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
}


async function fetchImageR34(type, page, response) {
  try {
    const url = await got(`${api3}?tags=${type}&pid=${page}`).json();
    const random = Math.floor(Math.random() * url.length);
    if (page === "random") {
      const randompage = Math.floor(Math.random() * 5) + 1;
      const url = await got(`${api3}?tags=${type}&pid=${randompage}`).json();
      got
        .stream(url[random].file_url.replace('https://rule34api.vercel.app/images?url=', ''))
        .on("response", (response) => {
          response.headers["cache-control"] = "no-cache";
          response.headers["X-Origin-Source"] = url[random].file_url.replace('https://rule34api.vercel.app/images?url=', '');
        }).pipe(response);
    } else {
      got
        .stream(url[random].file_url.replace('https://rule34api.vercel.app/images?url=', ''))
        .on("response", (response) => {
          response.headers["cache-control"] = "no-cache";
          response.headers["X-Origin-Source"] = url[random].file_url.replace('https://rule34api.vercel.app/images?url=', '');
        })
        .pipe(response);
    }
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
}

router.get('/waifu', (req, res) => {
  let option = req.query.nsfw
  if (!option) {
    option = "sfw"
  } else if (option === "show") {
    option = "nsfw"
  }
  fetchImage(option, "waifu", res);
})

router.get('/yaoi', (req, res) => {
  fetchImageR34("yaoi", "random", res);
});

router.get('/neko', (req, res) => {
  let option = req.query.nsfw
  if (!option) {
    option = "sfw"
  } else if (option === "show") {
    option = "nsfw"
  }
  fetchImage(option, "neko", res);
});

router.get('/yuri', (req, res) => {
  fetchImageR34("yuri", "random", res);
})

router.get('/kiss', (req, res) => {
  fetchImage("sfw", "kiss", res);
})

router.get('/trap', (req, res) => {
  fetchImage("nsfw", "trap", res);
})

router.get('/hug', (req, res) => {
  fetchImage("sfw", "hug", res);
})

router.get('/maid', (req, res) => {
  let option = req.query.nsfw
  if (!option) {
    option = "false"
  } else if (option === "show") {
    option = "true"
  }
  fetchImageWIM(`&is_nsfw=${option}`, "maid", res);
})


module.exports = router;
