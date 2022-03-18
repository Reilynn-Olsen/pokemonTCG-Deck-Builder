import React, { ReactElement, useState, useEffect } from 'react';
import './stylesheets/home.css';

type popularCards = {
  pokemon: {
    name: string;
    url: string;
  }
  trainer: {
    name: string;
    url: string;
  }
  energyType: string;
  mostPopularSuperType: 'pokemon' | 'trainer';
};

type energyTypes =  'Lightning' | 'Grass' | 'Psychic' | 'Metal' | 'Water' | 'Fighting' | 'Fire' | 'Darkness' | 'Fairy';


type backendDataAnalysis = {
  pokemon: {
    amount: number;
    url: string;
    name: string;
  };
  trainer: {
    amount: number;
    url: string;
    name: string;
  };
  type: energyTypes;
};


type energyURLs = {
  [key in energyTypes]: string;
}
/*
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

*/

function Home() {
  const [popularCards, setPopularCards] = useState<null | popularCards>();

  //need to confirm what the api calls these case sensitively obviously 
  const energy = {
    'Lightning': 'https://images.pokemontcg.io/sm2/168.png',
    'Grass': 'https://images.pokemontcg.io/sm2/167.png',
    'Psychic': 'https://images.pokemontcg.io/sm1/162.png',
    'Metal': 'https://images.pokemontcg.io/sm1/163.png',
    'Water': 'https://images.pokemontcg.io/sm4/124.png',
    'Fighting': 'https://images.pokemontcg.io/sm2/169.png',
    'Fire': 'https://images.pokemontcg.io/sm3/167.png',
    'Darkness': 'https://images.pokemontcg.io/sm3/168.png',
    'Fairy': 'https://images.pokemontcg.io/sm3/169.png',
  }

  useEffect(() => {
    fetch('/popularCards')
      .then((res) => res.json())
      .then((data: backendDataAnalysis) => {
        setPopularCards({
          pokemon: {
            url: data.pokemon.url,
            name: data.pokemon.name,
          },
          trainer: {
            url: data.trainer.url,
            name: data.trainer.name,
          },
          mostPopularSuperType:
            data.pokemon.amount > data.trainer.amount ? 'pokemon' : 'trainer',
          energyType: data.type,
        });
      });

      
  }, []);


  //todo, change the backend to give off pokemon name so the alt tag can be dynamically
  //set better for accessability
  //also need the types to appear
  return (
    <div id='homeContainer'>
      <div id="sloganContainer">
        <span className="l1"></span>
        <span className="l2"></span>
        <span className="l3"></span>
        <span className="l4"></span>
        <h1 id="slogan"> Build awesome decks, play good games, repeat. </h1>
      </div>

        {popularCards?.mostPopularSuperType === 'pokemon' ? (
          <div id='popularCardsContainer'>
            <div className='cardContainer'>
              <p className='cardLabel'>Most used card in all decks:</p>
              <img 
                className='cardImg'
                alt={`Most popular card of the day: ${popularCards.pokemon.name}`}
                src={popularCards?.pokemon.url}
              ></img>
            </div>
            <div className='cardContainer'>
              <p className='cardLabel'>Most used Trainer card in all decks:</p>
              <img
                className='cardImg'
                alt={`most popular trainer card of the day: ${popularCards.trainer.name}`}
                src={popularCards?.trainer.url}
              ></img>
            </div>
            <div className='cardContainer'>
              <p className='cardLabel'>Most popular type:</p>
              <img
                className='cardImg'
                alt={`most popular type: ${popularCards.energyType}`}
                src={energy[popularCards.energyType as energyTypes]}
              ></img>
            </div>
          </div>
        ) : (
          <div id='popularCardsContainer'>
            <div className='cardContainer'>
              <p className='cardLabel'>Most used card in all decks:</p>
              <img
                className='cardImg'
                alt={`Most popular card of the day: ${popularCards?.trainer.name}`}
                src={popularCards?.trainer.url}
              ></img>
            </div>
            <div className='cardContainer'>
              <p className='cardLabel'>Most used Pokemon card in all decks:</p>
              <img
                className='cardImg'
                alt={`Most popular pokemon card of the day: ${popularCards?.pokemon.name}`}
                src={popularCards?.pokemon.url}
              ></img>
            </div>
            <div className='cardContainer'>
              <p className='cardLabel'>Most popular type:</p>
              <img
                className='cardImg'
                alt={`most popular type: ${popularCards?.energyType}`}
                src={energy[popularCards?.energyType as energyTypes]}
              ></img>
            </div>
          </div>
        )}
    </div>
  );
}

export default Home;
