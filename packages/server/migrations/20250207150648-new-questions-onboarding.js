module.exports = {
  async up(db) {
    // Delete existing onboarding questions
    await db.collection('questions').deleteMany({ onboarding: true });

    // Add new onboarding questions
    await db.collection('questions').insertMany([
      {
        position: 1,
        question: {
          en: "Where are you browsing from?",
          de: "Von wo aus browsst du?"
        },
        subtitle: {
          en: "This helps us show brands that deliver to your location and connect you with local gems.",
          de: "Das hilft uns, dir Marken zu zeigen, die an deinen Standort liefern und dich mit lokalen Schätzen zu verbinden."
        },
        type: "location",
        onboarding: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        position: 2,
        question: {
          en: "What do you want to explore first?",
          de: "Was möchtest du zuerst erkunden?"
        },
        subtitle: {
          en: "Tell us what you're most excited about!",
          de: "Sag uns, worauf du dich am meisten freust!"
        },
        type: "categorized-multi-select",
        options: [
          {
            category: {
              en: "Clothing",
              de: "Kleidung"
            },
            options: [
              {
                id: "male",
                en: "Male",
                de: "Herren"
              },
              {
                id: "female",
                en: "Female",
                de: "Damen"
              },
              {
                id: "unisex",
                en: "Unisex",
                de: "Unisex"
              },
              {
                id: "kids",
                en: "Kids",
                de: "Kinder"
              }
            ]
          },
          {
            category: {
              en: "Beauty & Personal Care",
              de: "Schönheit & Körperpflege"
            },
            options: [
              {
                id: "skincare",
                en: "Skincare",
                de: "Hautpflege"
              },
              {
                id: "haircare",
                en: "Haircare",
                de: "Haarpflege"
              },
              {
                id: "oral-care",
                en: "Oral Care",
                de: "Mundpflege"
              }
            ]
          },
          {
            category: {
              en: "Food & Drinks3",
              de: "Essen & Getränke"
            },
            options: [
              {
                id: "snacks",
                en: "Snacks",
                de: "Snacks"
              },
              {
                id: "coffee",
                en: "Coffee",
                de: "Kaffee"
              },
              {
                id: "tea",
                en: "Tea",
                de: "Tee"
              },
              {
                id: "chocolate",
                en: "Chocolate",
                de: "Schokolade"
              }
            ]
          },
          {
            category: {
              en: "Food & Drinks4",
              de: "Essen & Getränke"
            },
            options: [
              {
                id: "snacks",
                en: "Snacks",
                de: "Snacks"
              },
              {
                id: "coffee",
                en: "Coffee",
                de: "Kaffee"
              },
              {
                id: "tea",
                en: "Tea",
                de: "Tee"
              },
              {
                id: "chocolate",
                en: "Chocolate",
                de: "Schokolade"
              }
            ]
          },
          {
            category: {
              en: "Food & Drinks5",
              de: "Essen & Getränke"
            },
            options: [
              {
                id: "snacks",
                en: "Snacks",
                de: "Snacks"
              },
              {
                id: "coffee",
                en: "Coffee",
                de: "Kaffee"
              },
              {
                id: "tea",
                en: "Tea",
                de: "Tee"
              },
              {
                id: "chocolate",
                en: "Chocolate",
                de: "Schokolade"
              }
            ]
          },
          {
            category: {
              en: "Food & Drinks6",
              de: "Essen & Getränke"
            },
            options: [
              {
                id: "snacks",
                en: "Snacks",
                de: "Snacks"
              },
              {
                id: "coffee",
                en: "Coffee",
                de: "Kaffee"
              },
              {
                id: "tea",
                en: "Tea",
                de: "Tee"
              },
              {
                id: "chocolate",
                en: "Chocolate",
                de: "Schokolade"
              }
            ]
          },
          {
            category: {
              en: "Food & Drinks7",
              de: "Essen & Getränke"
            },
            options: [
              {
                id: "snacks",
                en: "Snacks",
                de: "Snacks"
              },
              {
                id: "coffee",
                en: "Coffee",
                de: "Kaffee"
              },
              {
                id: "tea",
                en: "Tea",
                de: "Tee"
              },
              {
                id: "chocolate",
                en: "Chocolate",
                de: "Schokolade"
              }
            ]
          }
        ],
        onboarding: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        position: 3,
        question: {
          en: "What excites you most when discovering a new brand?",
          de: "Was begeistert dich am meisten beim Entdecken einer neuen Marke?"
        },
        subtitle: {
          en: "This helps us to show brands that have products that match your interest",
          de: "Das hilft uns, dir Marken zu zeigen, die Produkte haben, die zu deinen Interessen passen"
        },
        type: "single-select",
        options: [
          {
            id: "mission-impact",
            en: "**Mission & Impact** - I care about sustainability, ethical production, or social good",
            de: "**Mission & Wirkung** - Mir sind Nachhaltigkeit, ethische Produktion oder soziales Engagement wichtig"
          },
          {
            id: "uniqueness-innovation",
            en: "**Uniqueness & Innovation** - I love discovering brands with fresh ideas and creative products",
            de: "**Einzigartigkeit & Innovation** - Ich liebe es, Marken mit frischen Ideen und kreativen Produkten zu entdecken"
          },
          {
            id: "quality-craftsmanship",
            en: "**Quality & Craftsmanship** - I look for well-made, premium, and durable products",
            de: "**Qualität & Handwerkskunst** - Ich suche nach gut gemachten, hochwertigen und langlebigen Produkten"
          },
          {
            id: "good-deals-value",
            en: "**Good Deals & Value** - I'm interested in exclusive offers or good pricing",
            de: "**Gute Angebote & Wert** - Ich interessiere mich für exklusive Angebote oder gute Preise"
          }
        ],
        onboarding: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        position: 4,
        question: {
          en: "Would you like to see brands that match your budget?",
          de: "Möchtest du Marken sehen, die zu deinem Budget passen?"
        },
        subtitle: {
          en: "This helps us to show brands that have products that match your interest",
          de: "Das hilft uns, dir Marken zu zeigen, die Produkte haben, die zu deinen Interessen passen"
        },
        type: "single-select",
        options: [
          {
            id: "premium",
            en: "I'm open to premium brands (high-quality, handcrafted, or luxury)",
            de: "Ich bin offen für Premium-Marken (hochwertig, handgefertigt oder Luxus)"
          },
          {
            id: "affordable",
            en: "I prefer affordable & mid-range brands",
            de: "Ich bevorzuge erschwingliche & mittlere Preisklassen"
          },
          {
            id: "mix",
            en: "Show me a mix of both",
            de: "Zeig mir eine Mischung aus beidem"
          }
        ],
        onboarding: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        position: 5,
        question: {
          en: "How important is design in everyday objects to you?",
          de: "Wie wichtig ist dir Design bei Alltagsgegenständen?"
        },
        type: "scale",
        scaleTopLabel: {
          en: "Very important",
          de: "Sehr wichtig"
        },
        scaleBottomLabel: {
          en: "Not important at all",
          de: "Gar nicht wichtig"
        },
        displayImage: {
          "thumbnail": "603755f805208bc74a4c8dfa26cc577f.jpeg",
          "medium": "603755f805208bc74a4c8dfa26cc577f.jpeg",
          "original": "603755f805208bc74a4c8dfa26cc577f.jpeg",
          "high": "603755f805208bc74a4c8dfa26cc577f.jpeg"
        },
        onboarding: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(db) {
    // Remove the questions we added
    await db.collection('questions').deleteMany({ onboarding: true });
  }
};
