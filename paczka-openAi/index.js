require('dotenv').config();
const readline = require('readline');
const OpenAI = require('openai');
const apiKey = process.env.OPENAI_API_KEY;

const insertDashes = () => console.log('----------------------------------------------------------------');

const countPriceUsd = (usage) => {

  return usage.prompt_tokens / 1000 * 0.001 + usage.completion_tokens / 1000 * 0.002; // 3.5T

  //   return usage.prompt_tokens / 1000 * 0.03 + usage.completion_tokens / 1000 * 0.06; // 4

  // return usage.prompt_tokens / 1000 * 0.01 + usage.completion_tokens / 1000 * 0.03; // 4T
};

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

  const userAsk = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system', content: 'Jesteś klasyfikatorem sentymentu podanego przez użytkownika. $SENTYMENT tekstu może być "pozytywny", "negatywny" ,"neutralny". Odpowiadasz schematem: $SENTYMENT - napisany małymi literami ("pozytywny", "negatywny", "neutralny"), jedno krótkie zdanie opisujące ocenę. Odpowiedź podajesz w języku Polskim.',
      },
      {
        role: 'user', content: userQuestion, //dziś wieczorem ma być burza z piorunami
      }
    ],
  });
  const countedPrice = countPriceUsd(userAsk.usage);

  console.log(userAsk?.choices?.[0]?.message?.content ?? 'Brak odpowiedzi');
  console.log('Odpowiedź kosztowała ', parseFloat(countedPrice.toFixed(5)), '$');
  console.log('Wylądowaliśmy!');

})();