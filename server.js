const express = require('express');
const soap = require('soap');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');


const app = express();
const port = process.env.PORT || 3000; // Choisissez un port approprié
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send("SERVEUR EN FONCTIONNEMENT");
});

app.get('/calculateHour', (req, res) => {
    console.log(req.query.numbers);
    numbers = req.query.numbers;
    // if (!numbers || !Array.isArray(numbers)) {
    //     return res.status(400).json({ error: 'Invalid input. Expected an array of numbers.' });
    //   }

    try {
        numbers = JSON.parse(numbers);
    } catch (error) {
        return res.status(400).json({ error: 'Invalid input. Numbers parameter is not a valid JSON array.' });
    }

    //const floatNumbers = numbers.map(parseFloat);
    console.error("----------");
    const url = 'http://127.0.0.1:8000/?wsdl';
    var args = {
        numbers: {
            float: numbers
        }
    };
    console.log(args);
    soap.createClient(url, { strictSSL: false }, function (err, client) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error 1 ' });
        } else {
            client.CalculateSum(args, function (err, result) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Internal Server Error 2' });
                } else {
                    console.log(result.CalculateSumResult || -1);
                    res.json({ result: result.CalculateSumResult || -1 });
                }
            });
        }
    });
});


app.get('/findNearestBorne', async (req, res) => {
  console.log("FINDNEARESTBORNE");
    let { latitude, longitude, distance } = req.query;
    latitude = parseFloat(latitude);
    longitude = parseFloat(longitude);
    distance = parseFloat(distance);

    console.log(latitude,longitude,distance);
    const maxRetries = 100; // Définissez le nombre maximal de tentatives
  
    let retryCount = 0;
    let result = null;
  
    while (retryCount < maxRetries) {
      try {
        const url = `https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records?limit=1&where=xlongitude%20%3E%20${longitude - distance}%20AND%20xlongitude%20%3C%20${longitude + distance}%20AND%20ylatitude%20%3E%20${latitude - distance}%20AND%20ylatitude%20%3C%20${latitude + distance}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        result = await response.json();
        console.log(result)
        if (result.total_count > 0.0) {
          break; 
        } else {
          retryCount++;
          distance = distance + distance;
        }
      } catch (error) {
        console.error('Erreur lors de la recherche de la borne la plus proche :', error);
        res.status(500).json({ error: 'Erreur serveur interne.' });
        return;
      }
    }
    console.log(retryCount);
    if (result.total_count > 0.0) {
      res.json(result.results[0]);
    } else {
      console.log('Aucune borne trouvée dans la zone spécifiée après plusieurs tentatives.');
      res.status(404).json({ error: 'Aucune borne trouvée dans la zone spécifiée.' });
    }
  });



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


