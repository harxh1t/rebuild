import type { Choice } from "../../engine/types";
export const STEPS = [
  "collect",
  "settle",
  "filter",
  "safe",
  "boil",
  "deliver",
] as const;
export type WaterStep = (typeof STEPS)[number];
export interface WaterContent {
  title: string;
  eyebrow: string;
  intro: [string, string];
  prediction?: { question: string; choices: Choice[] };
  hints: [string, string, string];
  card: { belief: string; why: string; idea: string };
  chips: { question: string; answer: string }[];
}
export interface QuizQuestion {
  id: string;
  concept: string;
  question: string;
  transfer: boolean;
  options: {
    id: string;
    label: string;
    correct: boolean;
    misconception: string | null;
  }[];
  explanation: string;
}
export const QUIZ: QuizQuestion[] = [
  {
    id: "clear",
    concept: "water_safety",
    question: "A glass of water looks clear. What should you do?",
    transfer: false,
    options: [
      {
        id: "drink",
        label: "Drink it because it is clear",
        correct: false,
        misconception: "clear_means_safe",
      },
      {
        id: "treat",
        label: "Check and treat it first",
        correct: true,
        misconception: null,
      },
    ],
    explanation:
      "Clear water can still contain germs that our eyes cannot see.",
  },
  {
    id: "filter",
    concept: "filtration",
    question: "What does our homemade filter do best?",
    transfer: false,
    options: [
      {
        id: "germs",
        label: "It kills every germ",
        correct: false,
        misconception: "filtering_kills_germs",
      },
      {
        id: "dirt",
        label: "It removes much of the visible dirt",
        correct: true,
        misconception: null,
      },
    ],
    explanation:
      "Our filter removes dirt, but boiling is the germ-killing step.",
  },
  {
    id: "order",
    concept: "filter_order",
    question: "Which material belongs at the bottom outlet of our filter?",
    transfer: false,
    options: [
      {
        id: "pebbles",
        label: "Pebbles",
        correct: false,
        misconception: "filter_layer_order",
      },
      { id: "cotton", label: "Cotton", correct: true, misconception: null },
      {
        id: "fine",
        label: "Fine sand",
        correct: false,
        misconception: "filter_support_missing",
      },
    ],
    explanation:
      "Cotton supports the loose layers while letting water pass through.",
  },
  {
    id: "rain",
    concept: "transfer_water_safety",
    question: "Is rainwater collected in an open pot safe to drink?",
    transfer: true,
    options: [
      {
        id: "yes",
        label: "Yes, rainwater is always safe",
        correct: false,
        misconception: "clear_means_safe",
      },
      {
        id: "check",
        label: "No—check and treat it first",
        correct: true,
        misconception: null,
      },
    ],
    explanation:
      "An open pot can collect dirt and germs, so the water needs checking and treatment.",
  },
];

export const APPLICATIONS = [
  {
    icon: "filter",
    title: "After a flood",
    line: "A bottle filter can remove dirt before a safer treatment step.",
  },
  {
    icon: "boil",
    title: "Why boiling matters",
    line: "A rolling boil kills disease-causing germs in clear water.",
  },
  {
    icon: "health",
    title: "Clean water, healthier days",
    line: "Safer water helps families avoid illnesses caused by germs.",
  },
] as const;

// Integration seam for Seat C: the typed box stays hidden in this standalone build.
export function answerRioTyped(question: string, step: WaterStep) {
  const words = new Set(question.toLowerCase().match(/[a-z]+/g) ?? []);
  return CONTENT[step].chips
    .map((chip) => ({
      chip,
      score: (chip.question.toLowerCase().match(/[a-z]+/g) ?? []).filter(
        (word) => words.has(word),
      ).length,
    }))
    .sort((a, b) => b.score - a.score)[0].chip.answer;
}
export const CONTENT: Record<WaterStep, WaterContent> = {
  collect: {
    title: "A jar full of questions",
    eyebrow: "01 / COLLECT",
    intro: [
      "The storm left our water muddy. Let’s take a closer look.",
      "Tap the bucket to collect a sample.",
    ],
    hints: [
      "Look for the wooden bucket.",
      "The bucket is beside the glass jar.",
      "Tap Collect water to pour a sample into the jar.",
    ],
    card: {
      belief: "Water is ready to drink as soon as we collect it.",
      why: "Mud and unseen germs can be in collected water.",
      idea: "Collecting is the start. We need to treat the water before drinking.",
    },
    chips: [
      {
        question: "Why use a jar?",
        answer:
          "A clear jar helps us see changes. Look at the colour and the bits floating inside.",
      },
      {
        question: "Can we taste it?",
        answer:
          "No. Use your eyes for this experiment. Ask an adult to help treat water before anyone drinks.",
      },
      {
        question: "What should I notice?",
        answer:
          "Look for tiny bits and changes in colour. Scientists begin by noticing things.",
      },
    ],
  },
  settle: {
    title: "Give the water a quiet moment",
    eyebrow: "02 / SETTLE",
    intro: [
      "What might happen if we leave this jar still?",
      "Make a prediction, then hold Wait to watch.",
    ],
    prediction: {
      question: "What happens if we leave the water still?",
      choices: [
        {
          id: "float",
          label: "The mud floats up",
          correct: false,
          misconception: "mud_floats",
        },
        {
          id: "sink",
          label: "The mud sinks down",
          correct: true,
          misconception: null,
        },
        {
          id: "same",
          label: "Nothing changes",
          correct: false,
          misconception: "settling_no_change",
        },
      ],
    },
    hints: [
      "Watch one tiny piece of mud.",
      "Look near the bottom of the jar.",
      "Hold Wait until the mud forms a layer at the bottom.",
    ],
    card: {
      belief: "All the mud will float or stay mixed forever.",
      why: "Heavier bits slowly sink when water is left still.",
      idea: "Settling removes some dirt. The water above still needs treatment.",
    },
    chips: [
      {
        question: "Why keep the jar still?",
        answer:
          "Moving the jar stirs the bits around. Keeping it still lets us notice what they do on their own.",
      },
      {
        question: "Why is it still cloudy?",
        answer:
          "Some bits are very small. Look closely at the water above and below.",
      },
      {
        question: "What is settling?",
        answer:
          "Settling is what we call the change when heavier pieces slowly move down through still water.",
      },
    ],
  },
  filter: {
    title: "Build a path for every drop",
    eyebrow: "03 / FILTER",
    intro: [
      "Different materials catch different bits of dirt.",
      "Choose a sack, then tap a slot. Build from the bottom up.",
    ],
    hints: [
      "Water enters at the top and leaves at the bottom. Think about big bits and small bits.",
      "Look at the bottom slot: what could stop loose grains washing out?",
      "Bottom to top: cotton, activated charcoal, fine sand, coarse sand, pebbles.",
    ],
    card: {
      belief: "Any order of materials cleans water equally well.",
      why: "Our filter needs support at the outlet and coarser grains before finer grains.",
      idea: "Layer order matters. Clear filtered water can still contain germs.",
    },
    chips: [
      {
        question: "Why use cotton?",
        answer:
          "Think of a soft net. What might it keep inside while water passes through?",
      },
      {
        question: "Why different grain sizes?",
        answer:
          "Compare the gaps between pebbles with the gaps between sand grains. Different gaps catch different-sized bits.",
      },
      {
        question: "What does charcoal do?",
        answer:
          "Activated charcoal has many tiny spaces on its surface. It can trap some substances, but it is not a germ-killing step.",
      },
    ],
  },
  safe: {
    title: "Clear is only what we can see",
    eyebrow: "04 / LOOK CLOSER",
    intro: [
      "Our filtered water looks clear.",
      "Would you drink it now, or check first?",
    ],
    prediction: {
      question: "Is this clear water safe to drink?",
      choices: [
        {
          id: "yes",
          label: "Yes, it looks clean",
          correct: false,
          misconception: "clear_means_safe",
        },
        {
          id: "check",
          label: "Check first",
          correct: true,
          misconception: null,
        },
      ],
    },
    hints: [
      "Our eyes cannot see everything.",
      "Watch the magnified view beside the glass.",
      "Tiny germs can remain even when dirt has been removed.",
    ],
    card: {
      belief: "If water looks clear, it must be safe.",
      why: "Germs can be too small to see with our eyes.",
      idea: "Clear does not mean safe. Our water still needs a germ-killing step.",
    },
    chips: [
      {
        question: "What is that round view?",
        answer:
          "It is an imagined, greatly enlarged view. These germs are far too small to see through an ordinary magnifying glass.",
      },
      {
        question: "Why look more closely?",
        answer:
          "Scientists use tools to learn about things our eyes cannot see.",
      },
      {
        question: "Was my prediction useful?",
        answer:
          "Yes. Comparing a prediction with what happens is how we learn, even when the result is a surprise.",
      },
    ],
  },
  boil: {
    title: "One more step for safer water",
    eyebrow: "05 / BOIL",
    intro: [
      "Does our homemade filter remove all the germs?",
      "Predict first. Then add wood, strike the flint, and hold Fan.",
    ],
    prediction: {
      question: "Does our homemade filter remove all germs?",
      choices: [
        {
          id: "filter-yes",
          label: "Yes, filtering removes all germs",
          correct: false,
          misconception: "filtering_kills_germs",
        },
        {
          id: "filter-no",
          label: "No, we still need to treat it",
          correct: true,
          misconception: null,
        },
      ],
    },
    hints: [
      "A fire needs fuel and air.",
      "Look at the wood beside the hearth.",
      "Add wood, strike the flint, then hold Fan until the rolling boil finishes.",
    ],
    card: {
      belief: "Our homemade filter removes all germs.",
      why: "It removes dirt, but cannot reliably remove germs. Boiling kills disease-causing germs.",
      idea: "Ask an adult: rolling boil for 1 minute, or 3 minutes above 2,000 m. Cool and store covered.",
    },
    chips: [
      {
        question: "Why fan the fire?",
        answer:
          "Fanning supplies more air. Watch how the fire changes when you fan and when you pause.",
      },
      {
        question: "Is this real time?",
        answer:
          "No. The animation speeds time up. Real water needs a rolling boil for one minute, longer at high altitude.",
      },
      {
        question: "Can boiling fix any water?",
        answer:
          "No. Boiling kills germs but does not remove harmful chemicals. Ask an adult about a safe water source.",
      },
    ],
  },
  deliver: {
    title: "A small act. A healthier day.",
    eyebrow: "06 / DELIVER",
    intro: [
      "The water has cooled and is covered.",
      "You cared for every drop. Now we can share it.",
    ],
    hints: [
      "Keep treated water covered.",
      "Use a clean container.",
      "Cool the water before anyone drinks.",
    ],
    card: {
      belief: "Treated water can be stored any way we like.",
      why: "Dirty hands and containers can put germs back into water.",
      idea: "Keep treated water in a clean, covered container.",
    },
    chips: [
      {
        question: "Why cover the pot?",
        answer:
          "A cover helps keep dust and dirt from getting back into the treated water.",
      },
      {
        question: "Why let it cool?",
        answer:
          "Hot water can burn. An adult should handle boiling and let the water cool before anyone drinks.",
      },
      {
        question: "What can I share?",
        answer:
          "Tell someone one thing you discovered about clear water and germs.",
      },
    ],
  },
};
