require('dotenv').config();
const readline = require('readline');
const OpenAI = require('openai');
const apiKey = process.env.OPENAI_API_KEY;

const insertDashes = () => console.log('----------------------------------------------------------------');

const countPriceUsd = (usage, modelName) => {
  if (modelName === 'gpt3T') {
    return usage.prompt_tokens / 1000 * 0.001 + usage.completion_tokens / 1000 * 0.002; // 3.5T
  } else if (modelName === 'gpt4') {
    return usage.prompt_tokens / 1000 * 0.03 + usage.completion_tokens / 1000 * 0.06; // 4
  }
  return usage.prompt_tokens / 1000 * 0.01 + usage.completion_tokens / 1000 * 0.03; // 4T
};

const benefitModel = (obj) => {
  let minKey = null;
  let minValue = Infinity;

  for (const [key, value] of Object.entries(obj)) {

    if (value < minValue) {
      minValue = value;
      minKey = key;
    }
  }
  const endRes = [
    minKey,
    parseFloat(minValue.toFixed(5))
  ];

  console.log(`Najtańszym modelem okazał się ${endRes[0]}, kosztował ${endRes[1]}$.`);
  insertDashes();
}

console.log('Lecimy!');

(async () => {
  const openai = new OpenAI({
    apiKey
  });

  // blok odpowiedzialny za zadanie pytania przez użytkownika

  const askAi = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const getQuestion = () => {
    return new Promise(resolve => {
      askAi.question('Zadaj pytanie: ', (questionContent) => {
        resolve(questionContent);
        insertDashes();
      });
    });
  };

  const userQuestion = await getQuestion();
  askAi.close();

  // koniec bloku

  const modelsGpt = {
    gpt3T: 'gpt-3.5-turbo',
    gpt4: 'gpt-4',
    gpt4T: 'gpt-4-turbo-preview'
  }

  const costsModel = {};

  for (const [modelName, modelValue] of Object.entries(modelsGpt)) {
    try {
      const userAsk = await openai.chat.completions.create({
        model: modelValue,
        messages: [
          {
            role: 'system', content: 'Jesteś klasyfikatorem sentymentu podanego przez użytkownika. $SENTYMENT tekstu może być "pozytywny", "negatywny" ,"neutralny". Odpowiadasz schematem: $SENTYMENT - napisany małymi literami ("pozytywny", "negatywny", "neutralny"), jedno krótkie zdanie opisujące ocenę. Odpowiedź podajesz w języku Polskim.',
          },
          {
            role: 'user', content: userQuestion, //dziś wieczorem ma być burza z piorunami
          }
        ],
      });
      const countedPrice = countPriceUsd(userAsk.usage, modelName);

      console.log(modelValue + ': ' + userAsk?.choices?.[0]?.message?.content ?? 'Brak odpowiedzi');
      console.log('Odpowiedź kosztowała ', parseFloat(countedPrice.toFixed(5)), '$');

      costsModel[modelValue] = countedPrice;
      insertDashes();

    } catch (err) {
      console.error('Wystąpił błąd', err);
    }
  }
  benefitModel(costsModel);
  console.log('Wylądowaliśmy!');

})();