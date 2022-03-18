import React, { ReactElement, useState, useEffect } from 'react';
import './stylesheets/BuildDeck.css';
import { PokemonTCG } from 'pokemon-tcg-sdk-typescript';
import { useParams, useNavigate } from 'react-router-dom';

type cardFilter = {
  id: string;
  name: string;
  image: string;
  price: number | null | undefined;
};

type cardsProp = {
  cards: cardFilter[];
  onChange: (a: string) => void;
};

type deckCountObject = {
  [id: string]: deckCount;
};

type deckCount = {
  count: number;
  image: string;
};

type newDeckModalProp = {
  userId?: string;
};

type query = {
  name: string;
  format: 'standard' | 'expanded';
};

type searchProps = {
  onClick: (a: cardFilter) => void;
  deck: cardFilter[];
  isDeckOwned: boolean;
};

type DeckViewerProps = {
  userId: string;
};

type idBackEndData = {
  deck: string[];
};

async function getCardsFromId(idArray: idBackEndData) {
  return await Promise.all(
    idArray.deck.map((id) =>
      PokemonTCG.findCardByID(id).then((card: PokemonTCG.Card) => ({
        id: card.id,
        name: card.name,
        image: card.images.small,
        price: card?.tcgplayer?.prices?.normal?.market || 0,
      }))
    )
  );
}

async function getCards(search: string, format: string) {
  const paramsV2: PokemonTCG.Parameter = {
    q: `legalities.${format}:Legal name:"${search}*"`,
  };

  return await PokemonTCG.findCardsByQueries(paramsV2).then(
    (cards: PokemonTCG.Card[]) =>
      cards.map((card: PokemonTCG.Card) => {
        return {
          id: card.id,
          name: card.name,
          image: card.images.small,
          price: card?.tcgplayer?.prices?.normal?.market || 0,
        };
      })
  );
}

function DeckViewer(props: DeckViewerProps) {
  const urlParams = useParams();
  const [deck, setDeck] = useState<cardFilter[]>([]);

  useEffect(() => {
    fetch(`/deck/${urlParams.deckId}`, {
      method: 'GET',
    })
      .then((res) => res.json())
      .then(getCardsFromId)
      .then((cards) => setDeck((deck) => [...cards, ...deck]));
  }, [urlParams.deckId]);

  const handleDeckChange = (urlToRemove: string): void => {
    //need to remove it from sql
    const index = deck.findIndex((obj) => obj.image === urlToRemove);
    fetch(`/deck/${urlParams.deckId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deck: deck.filter((_, i) => i !== index).map((obj) => obj.id) }),
    }).then(res => res.ok ? setDeck(deck.filter((_, i) => i !== index)) : null)
  };

  const addCardToDeck = (card: cardFilter) => {
    fetch(`/deck/${urlParams.deckId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deck: [...deck, card].map((obj) => obj.id) }),
    }).then((res) => (res.ok ? setDeck([...deck, card]) : null));
  };

  const isDeckOwnedByUser = urlParams.userId === props.userId;
  const isNewDeck = !urlParams.deckId && !urlParams.userId;
  return (
    <div>
      {isNewDeck ? <NewDeckModal userId={props.userId} /> : null}
      <div className={isNewDeck ? 'blur' : ''}>
        {isDeckOwnedByUser ? (
          <SearchBar
            onClick={addCardToDeck}
            deck={deck}
            isDeckOwned={isDeckOwnedByUser}
          />
        ) : null}
        <Deck cards={deck} onChange={handleDeckChange} />
      </div>
    </div>
  );
}

//need search bar
//search bar is a parent to results
function SearchBar(props: searchProps) {
  const [search, setSearch] = useState<query>({ name: '', format: 'standard' });
  const [results, setResults] = useState<cardFilter[]>([]);
  const [cardAmount, setCardAmount] = useState(2);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let formatChange = false;

    if (e.target.value === 'standard' || e.target.value === 'expanded') {
      setSearch({ name: search.name, format: e.target.value });
      formatChange = true;
    } else {
      setSearch({ name: e.target.value, format: search.format });
    }

    //this deals with the async nature of setState, by requesting the
    //API to make a request even if the state isn't updated
    if (search.name.length > 2) {
      setCardAmount(2);
      if (formatChange) {
        getCards(search.name, e.target.value).then((searchResults) => {
          setResults(searchResults);
        });
      } else {
        getCards(e.target.value, search.format).then((searchResults) => {
          setResults(searchResults);
        });
      }
    } else if (search.name.length === 0) {
      setResults([]);
    }
  };

  const handleAddToDeckClick = (clickedCardObj: cardFilter) => {
    const cardCount = props.deck.reduce((p, c) => {
      if (c.name === clickedCardObj.name) {
        return p + 1;
      } else {
        return p;
      }
    }, 0);
    if (props.deck.length >= 60) {
      alert("You can't add more than 60 cards to a deck");
    } else if (cardCount < 4 || isBasicEnergy(clickedCardObj.name)) {
      props.onClick(clickedCardObj);
    } else {
      alert(
        `You can't add more than four copies of the same card (${clickedCardObj.name}) to a deck`
      );
    }
  };

  const isBasicEnergy = (cardName: string): boolean => {
    const energyTypes = [
      'Fire',
      'Grass',
      'Lightning',
      'Water',
      'Metal',
      'Fighting',
      'Darkness',
      'Psychic',
      'Fairy',
    ];
    const cardNameArray = cardName.split(' ');
    return (
      energyTypes.includes(cardNameArray[0]) && cardNameArray[1] === 'Energy'
    );
  };

  //need to prevent a reloading of the page if enter is pressed on the search bar
  const displayCards = (cardsToShow: cardFilter[]): ReactElement => {
    if (cardsToShow.length === 0) {
      return <div id="cardContainer"></div>;
    }

    const showedCards =
      Math.round((window.innerWidth * 0.8) / 150) * cardAmount;
    const displayedCards = cardsToShow.slice(0, showedCards);

    const buttonsArray = [];
    if (showedCards > (showedCards / cardAmount) * 2) {
      buttonsArray.push(
        <button
          id="showLess"
          key={0}
          onClick={() => setCardAmount(cardAmount - 2)}
        >
          Show Less
        </button>
      );
    }
    if (showedCards < cardsToShow.length) {
      buttonsArray.push(
        <button
          id="showMore"
          key={1}
          onClick={() => setCardAmount(cardAmount + 2)}
        >
          Show More
        </button>
      );
    }

    return (
      <div>
        <div id="cardContainer">
          {displayedCards.map((cardObject) => (
            <img
              onClick={() => handleAddToDeckClick(cardObject)}
              className="card"
              src={cardObject.image}
              key={cardObject.id}
              alt="search results"
            ></img>
          ))}
        </div>
        <div id="loadContainer">{buttonsArray.map((el) => el)}</div>
      </div>
    );
  };

  return (
    <div id="searchDeckContainer">
      {props.isDeckOwned ? (
        <form id="searchForm">
          <label htmlFor="searchBar">Search for a card:</label>
          <br></br>
          <label htmlFor="standardButton">Standard: </label>
          <input
            type="radio"
            value="standard"
            id="standardRadioButton"
            name="format"
            onChange={handleSearchChange}
            checked={search.format === 'standard'}
          ></input>
          <br></br>
          <label htmlFor="expandedButton">expanded: </label>
          <input
            type="radio"
            value="expanded"
            id="expandedRadioButton"
            name="format"
            onChange={handleSearchChange}
          ></input>
          <br></br>
          <input
            type="text"
            id="searchBar"
            name="searchBar"
            onChange={handleSearchChange}
          ></input>
        </form>
      ) : null}

      {displayCards(results)}
      <div></div>
    </div>
  );
}

function Deck(props: cardsProp) {
  const displayDeck = (deck: cardFilter[]) => {
    const cardCount: deckCountObject = {};
    deck.forEach((card) => {
      if (cardCount[card.id]) {
        cardCount[card.id].count++;
      } else {
        cardCount[card.id] = { count: 1, image: card.image };
      }
    });

    const handleClick = (
      e: React.MouseEvent<
        HTMLImageElement | HTMLParagraphElement | HTMLDivElement
      >
    ): void => {
      let img: string | null | undefined;
      if (e.target instanceof HTMLImageElement) {
        img = e.target.getAttribute('src');
      } else if (e.target instanceof HTMLParagraphElement) {
        img = e.target.parentElement?.firstElementChild?.getAttribute('src');
      } else if (e.target instanceof HTMLDivElement) {
        img = e.target.firstElementChild?.getAttribute('src');
      }
      if (typeof img === 'string') {
        props.onChange(img);
      }
    };

    const cardElementArray: ReactElement[] = [];
    for (const card in cardCount) {
      cardElementArray.push(
        <div className="cardInDeckContainer" key={card} onClick={handleClick}>
          <img
            src={cardCount[card].image}
            className="card"
            alt="A card in your deck"
          ></img>
          <p className="cardCountContainer">{cardCount[card].count}</p>
        </div>
      );
    }

    return cardElementArray;
  };

  const displayDeckCount = () => {
    return props.cards.length > 0 ? props.cards.length : '';
  };

  return (
    <div id="deckContainer">
      {displayDeck(props.cards)}
    </div>
  );
}

function NewDeckModal(props: newDeckModalProp) {
  const [deckName, setDeckName] = useState('');
  const navigate = useNavigate();

  const handleNewDeckSubmit = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (deckName.trim().length < 3) {
      alert(
        'The name of the deck must be longer without leading / trailing spaces'
      );
    } else {
      console.log({ userId: props.userId, name: deckName.trim() });
      fetch('/deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: props.userId, name: deckName.trim() }),
      }).then((res) => {
        if (res.ok) {
          res.json().then((r) => {
            navigate(`/user/${props.userId}/deck/${r.deckId}`);
          });
        }
      });
    }
  };
  console.log(props.userId)
  return (
    <div id="newDeckModal">
      {props.userId ? 
      <form>
        <label htmlFor="deckName">Name your new deck:</label>
        <br />
        <input
          type="text"
          id="deckName"
          name="deckName"
          onChange={(e) => setDeckName(e.target.value)}
        />
        <br />
        <input
          type="submit"
          value="Make my new deck"
          onClick={handleNewDeckSubmit}
        />
      </form> : <div><p>Please log in or make an account first</p></div>}
    </div>
  );
}

export default DeckViewer;
