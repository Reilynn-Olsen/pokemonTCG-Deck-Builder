const express = require('express'); //Line 1
const app = express(); //Line 2
const port = process.env.PORT || 5000;
//const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jsonParser = bodyParser.json();
const cookieParser = require('cookie-parser');
const https = require('https');
const nodemailer = require('nodemailer');
require('dotenv').config()
app.use(cookieParser());

app.use(express.static('build'))

const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.user,
  host: process.env.host,
  database: process.env.database,
  password: process.env.password,
  port: process.env.port,
  ssl: { rejectUnauthorized: false },
});

type popularCard = {
  id?: number;
};

const greatestCard = {
  pokemon: {
    amount: 0,
    url: '',
    name: '',
  },
  trainer: {
    amount: 0,
    url: '',
    name: '',
  },
  type: '',
};


async function getPopularCards() {
  const types = {};
  const popularCards: popularCard = {};
  pool.query('SELECT deck FROM decks', async (err, r) => {
    if (err) {
      console.log(err);
    } else {
      r.rows.forEach((obj) => {
        obj.deck.forEach((id) => {
          if (popularCards[id]) {
            popularCards[id]++;
          } else {
            popularCards[id] = 1;
          }
        });
      });

      for (const prop in popularCards) {
        await https.get(
          `https://api.pokemontcg.io/v2/cards?q=id:${prop}`,
          (res) => {
            const chunks = [];
            res.on('data', (d) => {
              chunks.push(d);
            });

            res.on('end', () => {
              const body = Buffer.concat(chunks);
              const card = JSON.parse(String(body)).data[0];
              if (popularCards[prop] > greatestCard.pokemon.amount && card.supertype === 'Pokémon') {
                greatestCard.pokemon.amount = popularCards[prop];
                greatestCard.pokemon.url = card.images.large;
                greatestCard.pokemon.name = `${card.name} from ${card.set.name}`;
              } else if (
                card.supertype === 'Trainer' &&
                popularCards[prop] > greatestCard.trainer.amount
              ) {
                greatestCard.trainer.amount = popularCards[prop];
                greatestCard.trainer.url = card.images.large;
                greatestCard.trainer.name = `${card.name} from ${card.set.name}`;
              }

              if (card.supertype === 'Pokémon') {
                card.types.forEach((type) => {
                  if (types[type]) {
                    types[type] += popularCards[prop];
                  } else {
                    types[type] = popularCards[prop];
                  }
                });
              }
              let greatestType = '';
              for (const type in types) {
                if (!greatestType || types[greatestType] < types[type]) {
                  greatestType = type;
                }
              }
              greatestCard.type = greatestType;
            });
          }
        );
      }
    }
  });
}

getPopularCards();
setInterval(getPopularCards, 86400000);

function sendVerifyEmail(verificationCode: string, email: string) {
  const transporter = nodemailer.createTransport({
    port: 587, // true for 465, false for other ports
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.emailUser,
      pass: process.env.emailPassword,
    },
    secure: false,
    requireTLS: true,
  });

  const mailData = {
    from: 'testmailforrei@gmail.com', // sender address
    to: email, // list of receivers
    subject: 'Verify your email',
    text: `Verify your account here: https://pokemontcg-deck-builder.herokuapp.com/verify/${verificationCode}`,
  };

  transporter.sendMail(mailData, function (err, info) {
    if (err) {
      console.log(err);
    }
  });
}

app.get('/popularCards', (req, res) => {
  res.status(200).send(greatestCard);
});

//gets all decks
app.get('/allDecks', (req, res) => {
  pool.query(`SELECT id, accountid, name FROM decks`, (err, r) => {
    if (err) {
      console.log(err);
    } else {
      res.status(200).send(r.rows);
    }
  });
});

//gets one deck by id
app.get('/deck/:id', (req, res) => {
  pool.query(`SELECT deck FROM decks WHERE id = ${req.params.id}`, (err, r) => {
    if (err) {
      console.log(err);
    } else {
      res.status(200).send(r.rows[0]);
    }
  });
});

//updates a deck by id
app.put('/deck/:id', jsonParser, (req, res) => {
  pool.query(
    `UPDATE decks SET deck = '{${req.body.deck
      .map((el) => `"${el}"`)
      .join(',')}}' WHERE id = ${req.params.id}`,
    (err, r) => {
      if (err) {
        console.log(err);
      } else {
        res.sendStatus(200);
      }
    }
  );
});

//creates a deck
app.post('/deck', jsonParser, (req, res) => {
  pool.query(
    `INSERT INTO decks (accountid, name) VALUES (${req.body.userId}, '${req.body.name}') RETURNING *`,
    (err, r) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.status(200).send({ deckId: r.rows[0].id });
      }
    }
  );
});

const DEFAULT_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function getRandomCharFromAlphabet(alphabet: string): string {
  return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
}

function generateCode(
  idDesiredLength: number,
  alphabet = DEFAULT_ALPHABET
): string {
  /**
   * Create n-long array and map it to random chars from given alphabet.
   * Then join individual chars as string
   */
  return Array.from({ length: idDesiredLength })
    .map(() => {
      return getRandomCharFromAlphabet(alphabet);
    })
    .join('');
}

//makes a new account
app.post('/account', jsonParser, (req, res) => {
  const code = generateCode(10);
  pool.query(
    `INSERT INTO accounts (email, username, passwordhash, code) VALUES ('${
      req.body.email
    }', '${req.body.username}', '${bcrypt.hashSync(
      req.body.password,
      10
    )}', '${code}')`,
    (err, r) => {
      if (err) {
        console.log(err);
        if (err.code === '23505'){
          res.sendStatus(409)
        }
        res.sendStatus(500)

      } else {
        res.sendStatus(200);
      }
    }
  );
  sendVerifyEmail(code, req.body.email);
});

app.post('/verifyEmail', jsonParser, (req, res) => {
  pool.query(`UPDATE accounts SET verified = true WHERE code = '${req.body.code}'`, (err, r) => {
    if (err){
      console.log(err)
    } else {
      res.sendStatus(200)
    }
  })
})

app.post('/verify', jsonParser, (req, res) => {
  pool.query(
    `SELECT passwordhash, id, username, verified FROM accounts WHERE '${req.body.username}' = username`,
    (err, r) => {
      if (err) {
        console.log(err);
        res.sendStatus(504);
      } else if (
        r.rows[0] &&
        bcrypt.compareSync(req.body.password, r.rows[0].passwordhash)
      ) {
        res.status(200).send({
          emailVerified: r.rows[0].verified,
          verified: true,
          username: r.rows[0].username,
          userId: r.rows[0].id,
        });
      } else {
        res.status(200).send({ verified: false });
      }
    }
  );
});

app.post('/resetPasswordRequest', jsonParser, (req, res) => {
  //req.body.email
  const code = generateCode(12)
  pool.query(`UPDATE accounts SET code = ${code} WHERE email = ${req.body.email}`, (err, r) => {
    if (err){
      console.log(err)
    } else {
      const transporter = nodemailer.createTransport({
        port: 587, // true for 465, false for other ports
        host: 'smtp.gmail.com',
        auth: {
          user: process.env.emailUser,
          pass: process.env.emailPassword,
        },
        secure: false,
        requireTLS: true,
      });
    
      const mailData = {
        from: 'testmailforrei@gmail.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'Reset your password',
        text: `Reset your password here https://pokemontcg-deck-builder.herokuapp.com/reset/${code}}`,
      };
    
      transporter.sendMail(mailData, function (err, info) {
        if (err) {
          console.log(err);
        }
      });
    }
  })


})

app.put('/resetPassword', jsonParser, (req, res) => {
  pool.query(`UPDATE accounts SET password = ${req.body.password} WHERE code = ${req.body.code}`, (err, r) => {
    if (err){
      console.log(err)
      res.sendStatus(500)
    } else {
      res.sendStatus(200)
    }
  })


})

app.get('*',  function (req, res) {
  res.sendFile(__dirname +  '/build/index.html');
})


app.listen(port, () => {
  console.log(`express is listening on port ${port}`);
});
