import { getSecretValue } from "shared/secrets-provider";
import { MealPlanRequest } from "types";
const { OpenAIApi } = require("openai");

const openai = new OpenAIApi();

export const handler = async (event: MealPlanRequest) => {
  const { email, ingredients } = event;

  const prompt = `Generate a gluten-free dinner mealplan for the whole week with these ingredients: ${ingredients.join(
    ", "
  )} and with other random gluten free ingredients.
Result in must be in json format
Each meal recipe contains a name, a five sentences for instructions and an array of ingredients`;

  const apiKey = await getSecretValue(process.env.OPEN_AI_API_SECRET_NAME);

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt,
    temperature: 0.7,
    max_tokens: 3000,
    top_p: 0.4,
    frequency_penalty: 0,
    presence_penalty: 0,
  }, 
  {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const mealPlanResponse = JSON.parse(response.data.choices[0].text);

  const mealPlan = Object.keys(mealPlanResponse).map((day) => {
    const dayRecipe = mealPlanResponse[day];
    return {
      day,
      recipeName: getProperty<string>(dayRecipe, "name"),
      recipeIngredients: getProperty<string[]>(dayRecipe, "ingredients"),
      recipeInstructions: getProperty<string[]>(dayRecipe, "instructions"),
    };
  });

  return {
    statusCode: 200,
    mealPlan,
    mailTo: email,
  };
};

function getProperty<TResult>(object: any, property: string): TResult {
  const prop = Object.keys(object).find(
    (k) => k.toLowerCase() === property.toLowerCase()
  );

  return object[prop] as TResult;
}
