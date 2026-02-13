export const rtpMtpSubjects = [
  {
    id: "economics",
    name: "Economics",
    attempts: [
      
      {
        id: "eco_mtp2_sep25",
        name: "MTP II Sep 2025",
        type: "MTP",
        questions: [
          {
            text: "Which of the following mechanisms are used for Allocation of Resources in Public Financial Management",
            options: ["Market Mechanism", "Public Sector Units", "Both a and b", "Neither a nor B"],
            correctIndex: 2  // c
          },
          {
  type: "table",
  text: "The following table shows production data of a firm:",
  table: {
    caption: "Production & Cost Data",
    headers: ["Output (Units)", "Total Cost (₹)", "Average Cost (₹)"],
    rows: [
      { rowHead: "A", data: [10, 500, 50] },
      { rowHead: "B", data: [20, 900, 45] },
      { rowHead: "C", data: [30, 1200, 40] }
    ],
    collapsible: true,
    maxVisibleRows: 2
  },
  options: [
    "Average cost is minimum at 30 units",
    "Marginal cost is constant",
    "Total cost increases at increasing rate",
    "None of the above"
  ],
  correctIndex: 0
},
{
  type: "diagram",
  text: "The diagram given below shows:",
  diagram: `
<svg viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
  <!-- AXES -->
  <line x1="60" y1="20" x2="60" y2="300" stroke="#000" stroke-width="2"/>
  <line x1="60" y1="300" x2="460" y2="300" stroke="#000" stroke-width="2"/>

  <!-- AXIS LABELS -->
  <text x="20" y="160" transform="rotate(-90 20 160)">Price</text>
  <text x="450" y="330">X</text>
  <text x="40" y="20">Y</text>

  <!-- PRICE LINE -->
  <line x1="60" y1="150" x2="460" y2="150" stroke="#555"/>
  <text x="45" y="155">P</text>

  <!-- Q LINES -->
  <line x1="200" y1="150" x2="200" y2="300" stroke="#555"/>
  <line x1="300" y1="150" x2="300" y2="300" stroke="#555"/>
  <text x="185" y="320">Q₁</text>
  <text x="290" y="320">Q</text>

  <!-- D1 (SMOOTH & ALIGNED) -->
  <path d="M350 40 C330 120, 310 220, 280 300"
        fill="none" stroke="#000" stroke-width="2"/>
  <text x="350" y="35">D₁</text>

  <!-- D2 (PARALLEL & LEFT SHIFT) -->
  <path d="M260 40 C240 120, 220 220, 190 300"
        fill="none" stroke="#000" stroke-width="2"/>
  <text x="260" y="35">D₂</text>

  <!-- SHIFT ARROWS -->
  <polygon points="270,90 250,90 250,85 240,95 250,105 250,100 270,100"
           fill="#000"/>
</svg>
`,
  options: [
    "A change in demand due to rise in income and the good is inferior",
    "A shift in demand due to rise in price of substitute good",
    "A shift in demand due to fall in price of complementary good",
    "None of the above"
  ],
  correctIndex: 1
},
          {
            text: "Which of the following is/are a function of the government?",
            options: ["Allocation of Resources", "Distribution of Income and Wealth", "Economic Stabilization", "All of Above"],
            correctIndex: 3  // d
          },
          {
            text: "Which of the following is NOT an element of effective Government Budgeting?",
            options: ["Aggregate Fiscal Discipline", "Maximization of Revenue", "Allocative Efficiency", "Operational Efficiency"],
            correctIndex: 1  // d
          },
          {
            text: "Allocative efficiency can be improved by",
            options: ["Strategic Planning and Medium-Term Fiscal Framework", "Program Budgeting and Program Evaluation", "Both a and b", "Neither a nor b"],
            correctIndex: 2  // c
          },
          {
            text: "Information asymmetry with respect to factors that degrade the operational efficiency is defined as",
            options: [
              "Service providers know more about outputs and costs than those who allocate resources",
              "Spenders have incentives to use all the resources provided to them",
              "Government lacks independent information on performance",
              "Detailed ex-ante controls are costly and drive out initiative and variation"
            ],
            correctIndex: 0  // a
          },
          {
            text: "Which of the following statements is true about Open Market Operations?",
            options: [
              "Central Bank controls the flow of credit through the sale and purchase of securities in open market",
              "It increases money supply with commercial banks and public",
              "It will expand credit in the economy",
              "All of the above"
            ],
            correctIndex: 3  // d
          },
          {
            text: "Statutory Liquidity Ratio is",
            options: [
              "Banks have to keep deposits with RBI",
              "Certain percentage of deposits are to be kept by the bank in form of liquid assets",
              "It is the discount rate of the banks",
              "None of the above"
            ],
            correctIndex: 1  // b
          },
          {
            text: "The difference between revenue deficit and grants for creation of capital assets is called",
            options: ["Fiscal deficit", "Budget deficit", "Effective revenue deficit", "Primary deficit"],
            correctIndex: 2  // c
          },
          {
            text: "The Book The Wealth of Nations is written by",
            options: ["Adam Smith", "Arthur Pigou", "Robinson", "Ragnar Nurske"],
            correctIndex: 0  // a
          },
          {
            text: "The Nature of Business Economics",
            options: [
              "Business Economics is a Science",
              "Incorporate elements of Macro Analysis",
              "Interdisciplinary in Nature",
              "All the above"
            ],
            correctIndex: 3  // d
          },
          {
            text: "Which of these country is a purely socialist economy?",
            options: ["USSR", "China", "Vietnam", "None of these"],
            correctIndex: 3  // d
          },
          {
            text: "Rational Decision making requires that",
            options: [
              "One's Choice be arrived at logically and without error.",
              "One's Choice be consistent with one's goal.",
              "One's Choice never vary.",
              "The consumer plans to attain the highest possible level of satisfaction."
            ],
            correctIndex: 3  // d
          },
          {
            text: "The Substitution effect will be stronger when",
            options: [
              "The goods are closer substitute",
              "There is lower cost of switching to the substitute good.",
              "There is lower inconvenience while switching to the Substitute good.",
              "All the above"
            ],
            correctIndex: 3  // d
          },
          {
            text: "What are the Internal Causes of Business Cycle?",
            options: [
              "Fluctuations in effective demand.",
              "Macroeconomic Policies",
              "Money Supply",
              "All the above"
            ],
            correctIndex: 3  // d
          },
          {
            text: "According to Hawtrey trade cycle is",
            options: ["a Monetary Phenomenon", "Unplanned Phenomenon", "Fiscal Phenomenon", "All the above"],
            correctIndex: 0  // a
          },
          {
            text: "Which of the following describe a typical Business Cycle?",
            options: [
              "Economic Expansions are followed by Contractions.",
              "Inflation is followed by rising Income and Unemployment.",
              "Economic Expansion are followed by economic growth and development.",
              "Stagflation is followed by Inflationary growth."
            ],
            correctIndex: 0  // a
          },
          {
            text: "A Relative Price is",
            options: [
              "Price expressed in terms of money.",
              "The ratio of one money price to another",
              "Equal to money price.",
              "None of these."
            ],
            correctIndex: 1  // b
          },
          {
            text: "In case of Substitute Product",
            options: [
              "The Demand Curve Slope upwards.",
              "The Demand Curve Slope downwards",
              "The Demand Curve is Perfectly Elastic",
              "None of these."
            ],
            correctIndex: 0  // a
          },
          {
            text: "A dealer sells only two brands of Motorcycle- Royal and Hero. It was observed that when the price of royal rises by 10% the demand for Hero increases by 15%. What is the cross elasticity of Hero against the Price of Royal?",
            options: ["1.5", "-1.5", "2.5", "None of these"],
            correctIndex: 0  // a
          },
          {
            text: "When e > 0, elasticity of demand is",
            options: ["Perfectly elastic", "Unitary", "Inelastic", "Perfectly inelastic demand"],
            correctIndex: 0  // a
          },
          {
            text: "A rise in Price will",
            options: [
              "Increase in Consumer Surplus",
              "Decrease in Consumer Surplus",
              "No Change in Consumer Surplus",
              "None of these"
            ],
            correctIndex: 1  // b
          },
          {
            text: "Marginal Product is the slope of",
            options: [
              "Marginal product Curve",
              "Average Product Curve",
              "Total Product Curve",
              "Implicit Product Curve"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Law of Production does not include",
            options: [
              "Least Cost Combination of factors",
              "Law of variable proportion",
              "Law of diminishing returns to a factor",
              "None of these"
            ],
            correctIndex: 0  // a
          },
          {
            text: "What are the determinants of price elasticity?",
            options: [
              "Availability of substitutes",
              "Price range",
              "Position of a Commodity in the Consumers budget.",
              "All the above"
            ],
            correctIndex: 3  // d
          },
          {
            text: "Income elasticities in the short run and long run",
            options: ["differ", "Same", "Can't say", "Both a and b"],
            correctIndex: 0  // a
          },
          {
            text: "Accounting costs are",
            options: ["Implicit cost", "Explicit Costs", "Economics Costs", "None of these"],
            correctIndex: 1  // b
          },
          {
            text: "Telecom Industry is an example of",
            options: ["Monopoly", "Perfect Competition", "Oligopoly", "Monopolistic competition"],
            correctIndex: 2  // c
          },
          {
            text: "On the basis of nature of transaction the market is classified into",
            options: [
              "Regulated and Unregulated market",
              "Wholesale and Retail market",
              "Spot and future Market",
              "None of these"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Total Revenue is maximised when total revenue is",
            options: ["1", "0", "High", "None of these"],
            correctIndex: 1  // b
          },
          {
            text: "Third degree Price discrimination can be explained through example of",
            options: [
              "Dumping",
              "Charging different Prices for domestic and commerce use",
              "Lower Price in ratioing for senior citizen",
              "All of the above."
            ],
            correctIndex: 3  // d
          },
          {
            text: "Related goods are of ___ types.",
            options: ["two", "three", "Four", "Five"],
            correctIndex: 1  // b
          },
          {
            text: "The elasticity of supply at any point on a given supply curve passing through the origin point making angle of 35 degree with X-axis is",
            options: ["Greater than one", "Less than one", "Equal to one", "Any of the above"],
            correctIndex: 0  // a
          },
          {
            text: "Traditional approach of law of demand was propounded by",
            options: ["Giffen", "Paul A Samuelson", "Alfred Marshall", "Pique"],
            correctIndex: 2  // c
          },
          {
            text: "Which initiative aims to improve agricultural market infrastructure?",
            options: ["PM Kisan", "E-NAM", "NDAP", "Shoonya"],
            correctIndex: 1  // b
          },
          {
            text: "Which year marked the beginning of the Green Revolution?",
            options: ["1947", "1956", "1965", "1991"],
            correctIndex: 2  // c
          },
          {
            text: "What was the average GDP growth rate between 1950-80 (Hindu growth rate)?",
            options: ["2", "3.5", "5", "7"],
            correctIndex: 1  // b
          },
          {
            text: "Which state was NOT a major beneficiary of the Green Revolution?",
            options: ["Punjab", "Haryana", "Bihar", "Western UP"],
            correctIndex: 2  // c
          },
          {
            text: "Which sector contributed the most to India's GDP in 2022?",
            options: ["Agriculture", "Industry", "Services", "Mining"],
            correctIndex: 2  // c
          },
          {
            text: "Which initiative is aimed at reducing India's oil import bill through alternative fuel?",
            options: ["NDAP", "Methanol Economy Programme", "Shoonya", "E-Amrit"],
            correctIndex: 1  // b
          },
          {
            text: "FDI is distinguished from FPI mainly because",
            options: [
              "FDI is short-term",
              "FDI is only financial",
              "FDI involves ownership control",
              "FDI is speculative"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Brownfield investment refers to",
            options: [
              "Building new infrastructure",
              "Investing in agriculture",
              "Buying or leasing existing setups",
              "foreign loans for farms"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following best defines the real exchange rate?",
            options: [
              "The market rate for converting one currency into another",
              "The rate at which a country trades goods/service for another",
              "Rate fixed by central bank",
              "The average of spot and forward rates"
            ],
            correctIndex: 1  // b
          },
          {
            text: "Which of the following effects real exchange rate directly?",
            options: [
              "Spot rate only",
              "Domestic interest rate",
              "Domestic and foreign price levels",
              "Central bank reserves"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following is a disadvantage of a floating exchange rate system?",
            options: [
              "Requires large forex reserves",
              "Creates rigid monetary policy",
              "Currency fluctuations create trade uncertainty",
              "Fixed import/export prices"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Absolute advantage theory assumes",
            options: [
              "Equal opportunity cost",
              "Fixed exchange rates",
              "Mobility of labour across countries",
              "Labour as the only input"
            ],
            correctIndex: 3  // d
          },
          {
            text: "Which of the following is a non-tariff barrier?",
            options: ["Ad valorem duty", "Quotas", "Countervailing duty", "Export tax"],
            correctIndex: 1  // b
          },
          {
            text: "Tariff Rate Quotas (TRQ) refer to",
            options: [
              "Export quotas only",
              "Prohibited tariffs",
              "Low tariff for a quota and high tariff beyond",
              "Elimination of tariff and quota"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Which WTO agreement allows review of member trade policies?",
            options: [
              "TBT Agreement",
              "SPS Agreement",
              "Trade Policy Review Mechanism",
              "Agreement on Agriculture"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Escalated tariffs refer to",
            options: [
              "Uniform tariff structure",
              "Higher tariffs on final goods than raw materials",
              "Preferential tariffs",
              "Free trade policies"
            ],
            correctIndex: 1  // b
          },
          {
            text: "Which of the following protects against underpriced foreign goods?",
            options: ["TRIMs", "Safeguards", "Anti-dumping duty", "Import subsidy"],
            correctIndex: 2  // c
          },
                    {
            text: "New Trade Theory emphasizes",
            options: ["No gains from trade", "Constant returns to scale", "Economies of scale and product variety", "No role for governments"],
            correctIndex: 2  // c
          },
          {
            text: "The money multiplier is",
            options: ["1/(cr + er)", "1/(cr + er)", "1/(r + er)", "None of the above"],
            correctIndex: 0  // a
          },
          {
            text: "Money Supply M is equal to",
            options: ["M1 + M2", "CRR + SLR", "Money Multiplier × Base Money", "GDP × Inflation"],
            correctIndex: 2  // c
          },
          {
            text: "MSF is always",
            options: ["0.5% above repo", "2% above bank rate", "1% above repo rate", "1% below reverse repo"],
            correctIndex: 2  // c
          },
          {
            text: "Which is a consequence of high money multiplier?",
            options: ["High inflation risk", "Tight liquidity", "Increase in SLR", "Decline in GDP"],
            correctIndex: 0  // a
          },
          {
            text: "What is a liquidity trap?",
            options: [
              "Money becomes illiquid due to inflation",
              "Money supply becomes ineffective at zero interest rate",
              "Interest rate becomes infinite",
              "Bonds have negative yield"
            ],
            correctIndex: 1  // b
          },
          {
            text: "Which theory introduced the idea of interest rate influencing money demand?",
            options: ["Fisher's theory", "Cambridge approach", "Keynesian theory", "Inventory theory"],
            correctIndex: 2  // c
          },
          {
            text: "Which economist applied capital asset demand theory to money?",
            options: ["Keynes", "Tobin", "Baumol", "Milton Friedman"],
            correctIndex: 1  // b
          },
          {
            text: "The function of money that allows individuals to save purchasing power for the future is called",
            options: [
              "Medium of exchange",
              "Unit of account",
              "Store of value",
              "Standard of deferred payment"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Which statement about the Finance Bill is correct?",
            options: [
              "It authorizes public borrowing",
              "It includes details of tax proposals",
              "It gives expenditure estimates",
              "It is introduced in Rajya Sabha"
            ],
            correctIndex: 1  // b
          },
          {
            text: "Guillotine in budgetary procedure refers to",
            options: [
              "Cancelling debt",
              "Reducing tax rates",
              "Voting on all pending demands at once",
              "Cutting grants to states"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Which department manages internal public debt in India?",
            options: ["NITI Aayog", "Finance Commission", "RBI", "Economic Survey Cell"],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following reduces income inequality?",
            options: [
              "Flat tax system",
              "Public expenditure on luxury goods",
              "Progressive taxation and targeted subsidies",
              "Tax holidays for MNCs"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Outcome budgeting primarily links",
            options: [
              "Fiscal deficit with borrowing",
              "Policy and implementation",
              "Budget allocations with performance outcomes",
              "Revenue and capital expenditures"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Keynes advocated increased government spending to tackle",
            options: ["Hyperinflation", "Balance of payments deficit", "Recession and unemployment", "Asset bubbles"],
            correctIndex: 2  // c
          },
          {
            text: "Subsidy on goods with positive externalities leads to",
            options: ["Higher cost", "Higher price", "Lower price", "Inefficiency"],
            correctIndex: 2  // c
          },
          {
            text: "In the consumption function C = a + bYc, the term a represents",
            options: [
              "Marginal Consumption",
              "Marginal Income",
              "Autonomous Consumption",
              "Autonomous Investment"
            ],
            correctIndex: 2  // c
          },
          {
            text: "What typically happens during the contraction phase?",
            options: [
              "Employment increases",
              "Prices rise sharply",
              "Investment and demand decline",
              "GDP grows rapidly"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Which sector is most vulnerable to business cycles?",
            options: ["Agriculture", "Capital goods and durable goods", "Banking", "Education"],
            correctIndex: 1  // b
          },
          {
            text: "Which of the following does not lead to a shift in demand?",
            options: [
              "Change in income",
              "Change in population",
              "Change in price of the good",
              "Change in taste"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Which market has infinite price elasticity of demand?",
            options: ["Monopoly", "Monopolistic", "Oligopoly", "Perfect competition"],
            correctIndex: 3  // d
          },
          {
            text: "What is the marginal revenue when price elasticity of demand is 1?",
            options: ["Equal to price", "Equal to zero", "Equal to AR", "Maximum"],
            correctIndex: 1  // b
          },
          {
            text: "AR and MR curves coincide in",
            options: ["Monopoly", "Monopolistic competition", "Perfect competition", "Oligopoly"],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following leads to Internal economies of scale?",
            options: [
              "Technological progress in the industry",
              "Development of skilled labour in a region",
              "Bulk purchase of raw materials",
              "Government tax incentives"
            ],
            correctIndex: 0  // a
          },
          {
            text: "Which is an example of a sunk cost?",
            options: [
              "Cost of raw material",
              "Cost of hiring temporary workers",
              "Advertising expenditure already incurred",
              "Salaries to be paid"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Identify the items which is not a factor payment",
            options: [
              "free uniform to defence personnel.",
              "salaries to the members of Parliament.",
              "imputed rent of an owner-occupied building.",
              "scholarships given to the scheduled caste students."
            ],
            correctIndex: 3  // d
          },
          {
            text: "Demand for final consumption arises in",
            options: [
              "household sector only.",
              "government sector only.",
              "both household and government sector.",
              "neither household nor government sector."
            ],
            correctIndex: 2  // c
          },
          {
            text: "The effect of increase CRR will be reduced or nullified if",
            options: [
              "Bank rate is reduced.",
              "Securities are sold in the open market.",
              "SLR is increased.",
              "People do not borrow from non-banking institutions."
            ],
            correctIndex: 3  // d
          },
          {
            text: "Broad money refers to",
            options: ["M1", "M2", "M3", "M4"],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following is a lagging economic indicator?",
            options: [
              "Consumer confidence index",
              "Stock market performance",
              "Unemployment rate",
              "New housing starts"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Price Elasticity of Demand of a good is -3. It shows that",
            options: [
              "When price falls by 1%, demand rises by 3%",
              "When price rises by 1%, demand falls by 3%",
              "Either a or b",
              "Neither a nor b"
            ],
            correctIndex: 2  // c
          },
          {
            text: "The demand for meals at a medium-priced restaurant is elastic. If the management of the restaurant is considering raising prices, it can expect a relatively",
            options: [
              "Proportionately large fall in quantity demanded",
              "No change in quantity demanded",
              "Proportionately small fall in quantity demanded",
              "Infinite change in quantity demanded"
            ],
            correctIndex: 0  // a
          },
          {
            text: "Which of the following is not a reason for operation of increasing returns to a factor?",
            options: [
              "Better utilisation of fixed factor",
              "Limitation of fixed factor",
              "Increase in efficiency of variable factor",
              "Indivisibility of fixed factor"
            ],
            correctIndex: 1  // b
          },
                    {
            text: "At the Point of Inflexion",
            options: [
              "Total Product is maximum",
              "Average Product is maximum",
              "Marginal Product is maximum",
              "Marginal Product is zero"
            ],
            correctIndex: 3  // d
          },
          {
            text: "Cost function is a concept",
            options: ["Economical", "Functional", "Financial", "Technical"],
            correctIndex: 0  // a
          },
          {
            text: "According to Hawtrey trade cycle is",
            options: [
              "a Monetary phenomenon",
              "Unplanned phenomenon",
              "Fiscal phenomenon",
              "All the above"
            ],
            correctIndex: 0  // a
          },
          {
            text: "Minimum assured prices to the farmers to purchase their output by the government is called",
            options: ["Market Price", "Equilibrium Price", "Support Price", "Ceiling Price"],
            correctIndex: 2  // c
          },
          {
            text: "The income elasticity For Luxuries goods is",
            options: ["E > 1", "E < 1", "E = 0", "None of these"],
            correctIndex: 0  // a
          },
          {
            text: "Unique supply curve in monopoly is not due to",
            options: ["P > MC", "P = MC", "P < MC", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following involve a trade-off?",
            options: [
              "Taking a nap",
              "Going to University",
              "Watching a football game on Saturday afternoon",
              "All of these"
            ],
            correctIndex: 3  // d
          },
          {
            text: "The Pure monopolist in the long run can make pure profit due to",
            options: ["High Selling Price", "Advertising", "Low LAC Cost", "Blocked entry"],
            correctIndex: 3  // d
          },
          {
            text: "If the quantity demanded of mutton increases by 5% when the price of chicken increases by 20%, the cross elasticity of demand between mutton and chicken is",
            options: ["-0.25", "0.25", "-4", "4"],
            correctIndex: 1  // b
          },
          {
            text: "The Supply function is given as Q = -100 + 10P. Find the elasticity using point method when price is Rs 15",
            options: ["4", "3", "-5", "None of these"],
            correctIndex: 1  // b
          },
          {
            text: "The cobweb theory was propounded by",
            options: ["Hawtrey", "Adam smith", "Nicolas Kaldor", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "Find normal GDP if real GDP 450 and price index 120",
            options: ["540", "640", "500", "None of these"],
            correctIndex: 0  // a
          },
          {
            text: "Suppose the Consumption of an economy is given by C = 20 + 0.6Y and Investment I = 10 + 0.2Y. What will be the equilibrium level of National Income.",
            options: ["150", "200", "350", "None of these"],
            correctIndex: 1  // b
          },
          {
            text: "If commercial banks reduce their holdings of excess reserves",
            options: [
              "The money supply falls",
              "The money supply increases",
              "The monetary base falls",
              "None of these"
            ],
            correctIndex: 1  // b
          },
          {
            text: "Non tariff barriers (NTBs) include all the following except",
            options: ["import quotas", "technical standards of products", "tariff", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "Pure Oligopoly is based on the products.",
            options: ["Differentiated", "Homogeneous", "unrelated", "None of these"],
            correctIndex: 1  // b
          },
          {
            text: "Under equation C = a + bY, b = 0.8, what is the value of 2 sector expenditure multiplier",
            options: ["4", "5", "2", "None of these"],
            correctIndex: 1  // b
          }
        ]
      },
      {
        id: "eco_mtp2_may25",
        name: "MTP II May 2025",
        type: "MTP",
        questions: [
          {
            text: "GDP includes",
            options: ["neither intermediate nor final goods.", "both intermediate and final goods.", "intermediate, but not final, goods.", "final, but not intermediate, goods."],
            correctIndex: 3  // d
          },
          {
            text: "If depreciation exceeds gross investment",
            options: ["the economy's stock of capital may be either growing or shrinking.", "the economy's stock of capital is shrinking.", "the economy's stock of capital is growing.", "net investment is zero."],
            correctIndex: 1  // b
          },
          {
            text: "By summing the values added at each stage in the production of some good we obtain",
            options: ["the price of that good.", "the total income generated by that good's production.", "the total cost including profits of that product.", "all the above."],
            correctIndex: 3  // d
          },
          {
            text: "The value of money in Fisher's equation is determined by",
            options: ["Demand for money", "Supply of money", "Demand and supply of money", "None of the above"],
            correctIndex: 2  // c
          },
          {
            text: "Value of money is",
            options: ["Directly related to the price level", "Inversely related to the price level", "Proportionately related to the price level", "All the above"],
            correctIndex: 1  // b
          },
          {
            text: "Bank rate policy is not very effective because-",
            options: ["It requires a well-developed money market", "It cannot operate effectively", "All banks are not under the control of central bank", "All the above"],
            correctIndex: 0  // a
          },
          {
            text: "Inflation can be controlled by applying",
            options: ["Monetary and fiscal policies", "Monetary and labour policy", "Fiscal and Commercial Policies", "All of the above"],
            correctIndex: 0  // a
          },
          {
            text: "What is Currency Deposit Ratio (CDR)?",
            options: ["Ratio of money held by the public in currency to that of money held in bank deposits", "Ratio of money held by the public in bank deposits to that of money held by public in currency", "Ratio of money held in demand drafts to that of money held in treasury bonds", "None of the above"],
            correctIndex: 0  // a
          },
          {
            text: "Open Market Operation is",
            options: ["Buying and selling of government securities", "Sale of government securities", "Buying and selling of government cheques", "All of the above"],
            correctIndex: 0  // a
          },
          {
            text: "Which of the following is a qualitative or selective method of credit control by the central bank?",
            options: ["Bank rate or Discount Rate Policy", "Open market operations", "Cash Reserve Ratio", "None of the above"],
            correctIndex: 3  // d
          },
          {
            text: "The fiscal deficit excluding the interest liabilities for a year is called as",
            options: ["Revenue deficit", "Capital deficit", "Budget deficit", "Primary deficit"],
            correctIndex: 3  // d
          },
          {
            text: "Pump Priming is related with",
            options: ["Monetary policy", "Income policy", "Price policy", "Fiscal policy"],
            correctIndex: 3  // d
          },
          {
            text: "The modern state is",
            options: ["Laissez faire state", "Welfare state", "Aristocratic state", "Police state"],
            correctIndex: 1  // b
          },
          {
            text: "Public Debt Management refers to",
            options: ["Terms of new bonds", "Proportion of different components of public debt", "Maturity", "All the above"],
            correctIndex: 3  // d
          },
          {
            text: "Education is an example of",
            options: ["Private good", "Public good", "Merit good", "Mixed good"],
            correctIndex: 2  // c
          },
          {
            text: "The World bank normally gives",
            options: ["Short term loans", "Medium term loans", "Long term loans", "medium- and long-term loans"],
            correctIndex: 3  // d
          },
          {
            text: "Balance of trade is",
            options: ["a Flow concept", "Stock concept", "Both A and B", "None of the above"],
            correctIndex: 0  // a
          },
          {
            text: "Which is not an advantage of International Trade?",
            options: ["Export of surplus production", "Import of defence material", "Dependence on foreign countries", "Availability of cheap raw material"],
            correctIndex: 2  // c
          },
          {
            text: "Which source of revenue is shared between the Centre and the States in India?",
            options: ["Excise duty", "Corporation tax", "Income tax", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following is a capital receipt in the government budget?",
            options: ["Income tax", "Interest on loans", "Borrowings", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "Which policy tool can the government use to correct negative externalities?",
            options: ["Subsidies", "Taxes", "Tariffs", "None of these"],
            correctIndex: 1  // b
          },
          {
            text: "Business Economics is",
            options: ["Practical application of economic theory in business decision making.", "Incorporates tools from multiple decisions", "Both a & b", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "Market demand is the sum total of",
            options: ["All quantities that producers can produce", "All quantities actually sold in the market", "All quantities demanded by individual household and consumers", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "The demand for Scooter and petrol is an example of demand",
            options: ["Joint", "Composite", "Competitive", "Market"],
            correctIndex: 0  // a
          },
          {
            text: "Goodwill, patent right, etc. are example of",
            options: ["Tangible capital", "Real capital", "Intangible capital", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "The basic behavioural principle which apply to all market conditions",
            options: ["A firm should product only if its TR > TVC", "A firm should produce at a level where its MC = MR", "MC curve cuts the MR curve from below", "All the above"],
            correctIndex: 3  // d
          },
          {
            text: "When growth rate becomes negative the level of National Income expenditure declines rapidly, we observe",
            options: ["Recovery", "Expansion", "Trough", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "Which item is excluded from the estimation of national income?",
            options: ["Rent from property", "Salary of public servants", "Illegal income", "Profits of corporations"],
            correctIndex: 2  // c
          },
          {
            text: "If the investment increases by 50 crores and the multiplier is 4, the change in income is",
            options: ["200 crores", "100 crores", "250 crores", "150 crores"],
            correctIndex: 0  // a
          },
          {
            text: "Which of the following is included in M1 in India?",
            options: ["Time deposits", "Currency with the public and demand deposits", "Bonds and shares", "Treasury bills"],
            correctIndex: 1  // b
          },
          {
            text: "Which of the following is a quantitative instrument of monetary policy?",
            options: ["Moral suasion", "Credit rationing", "Bank Rate", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "If the RBI increases the Cash Reserve Ratio (CRR), it will lead to",
            options: ["Increase in money supply", "Decrease in money supply", "No effect on money supply", "Increase in inflation"],
            correctIndex: 1  // b
          },
          {
            text: "Dumping refers to",
            options: ["Reducing tariffs", "Sale of goods abroad at a lower price, below their cost and price in their home market", "Buying goods at low prices abroad and selling at higher prices locally", "Expensive goods selling for low prices"],
            correctIndex: 1  // b
          },
          {
            text: "Trade between two countries can be useful if cost ratios of goods are",
            options: ["Undetermined", "Decreasing", "Equal", "Different"],
            correctIndex: 3  // d
          },
          {
            text: "Economic Survey is published by",
            options: ["Ministry of finance", "Planning commission", "Govt. of India", "Indian statistical institute"],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following combinations is correct?",
            options: ["NABARD - Industrial Loan", "IDBI - Short term Loans", "RBI - Long term Loans", "RRB - Agricultural Finance"],
            correctIndex: 3  // d
          },
          {
            text: "Rolling plan is a plan for",
            options: ["One year", "Two year", "Three year", "Five year"],
            correctIndex: 0  // a
          },
          {
            text: "Unemployment in a developing country is generally take place due to",
            options: ["Switch over from one job to another.", "Lack of effective demand", "Seasonal factors.", "Lack of complementary factors of production."],
            correctIndex: 3  // d
          },
          {
            text: "Disguised unemployment is common in",
            options: ["Agricultural sector", "Industrial sector", "Service sector", "None of these"],
            correctIndex: 0  // a
          },
          {
            text: "Import quota is",
            options: ["Tariff", "Non-Tariff barrier", "Concession", "International Obligation."],
            correctIndex: 1  // b
          },
          {
            text: "The best indicator of economic development of any country is",
            options: ["Its agriculture", "Its transport", "Its gross production", "Its per capital income."],
            correctIndex: 3  // d
          },
          {
            text: "The regulatory body of mutual funds in India is",
            options: ["RBI", "SEBI", "IRDA", "Government"],
            correctIndex: 1  // b
          },
          {
            text: "A market for borrowing and lending funds for a period exceeding 14 days",
            options: ["Term money market", "Call money market", "Commercial bill market", "None of these"],
            correctIndex: 0  // a
          },
          {
            text: "Which of the following are the instruments of money market?",
            options: ["Call money", "Certificate of deposits", "Trade bills", "All of the above"],
            correctIndex: 3  // d
          },
          {
            text: "Finance Commission",
            options: ["Is a Statutory Body", "Recommends the distribution of taxes between Union and States", "Cannot decide on principles related to Grants in Aid given by Union to States", "All of the above"],
            correctIndex: 1  // b
          },
          {
            text: "Statutory Liquidity Ratio is",
            options: ["Banks have to keep deposits with RBI", "Certain percentage of deposits are to be kept by the bank in form of liquid assets", "It is the discount rate of the banks", "None of the above"],
            correctIndex: 1  // b
          },
          {
            text: "Which of the following Budget documents is mandated by Fiscal Responsibility and Budget Management Act, 2003?",
            options: ["Annual Financial Statement (AFS)", "Demand for Grants", "Finance Bill", "Macro-Economic Framework Statement"],
            correctIndex: 3  // d
          },
          {
            text: "In a free market economy, the allocation of resources is determined by",
            options: ["Consumer Preferences", "Voting done by consumers", "The level of profit", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "The Heckscher-Ohlin model differs from the Ricardian model of Comparative Advantage in that the former",
            options: ["has only two countries.", "has only two products.", "has two factors of production.", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "According to Musgrave the major functions of public finance are",
            options: ["Allocative function", "Distributive function", "Stabilisation function", "All the above"],
            correctIndex: 3  // d
          },
              {
            text: "In the case of relatively elastic demand, the money burden of tax is on",
            options: ["More on seller", "More on buyer", "Entirely on seller", "Entirely on buyer"],
            correctIndex: 1  // b
          },
          {
            text: "One negative effect of high public expenditure is",
            options: ["Decrease in government control", "Increase in budget deficits and public debt", "Increase in private sector growth", "Reduction in social welfare"],
            correctIndex: 1  // b
          },
          {
            text: "Law of demand is violated when",
            options: ["Income effect is negative", "Substitution effect is negative", "Negative income effect is greater than the substitution effect", "None of these"],
            correctIndex: 2  // c
          },
          {
            text: "Elasticity is greater than unity for",
            options: ["Luxuries", "Necessaries", "Complementary good", "None of these"],
            correctIndex: 0  // a
          },
          {
            text: "Which of the following is not studied in microeconomics?",
            options: ["Factor pricing", "Location of Industry", "Consumer Behaviour", "External value of currency"],
            correctIndex: 3  // d
          },
          {
            text: "The Characteristics of capitalist economics does not include?",
            options: ["Right to Private property", "Freedom of economic choice", "Absence of Consumer choice", "Completion"],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following are within the scope of business economics?",
            options: ["Capital Budgeting", "Risk Analysis", "Business cycles", "All of the Above"],
            correctIndex: 3  // d
          },
          {
            text: "The Substitution effect will be stronger when",
            options: ["The goods are closer substitution", "There is lower cost of switching to the substitute goods", "There is lower Inconvenience while switching to the substitute good", "All the above"],
            correctIndex: 3  // d
          },
          {
            text: "In spite of the fact that the price of the television sets refrigerators, air conditions etc. have been continuously rising their demand does not stand any tendency to fall because they are",
            options: ["Conspicuous goods", "Giffen goods", "Speculative goods", "Conspicuous necessities."],
            correctIndex: 3  // d
          },
          {
            text: "What are the determinants of price elasticity?",
            options: ["Availability of substitutes", "Price range", "Position of a Commodity in the Consumers budget.", "All the above"],
            correctIndex: 3  // d
          },
          {
            text: "The turning point of business cycle is produced by when economic indicates",
            options: ["Coincident", "Lagging indicates", "leading Indicates", "All of the above"],
            correctIndex: 2  // c
          },
          {
            text: "U Shaped average cost curve is based on",
            options: ["Law of variance proportions", "Law of increasing cost", "Law of decreasing cost", "None of these"],
            correctIndex: 1  // b
          },
          {
            text: "The reason behind the upward sloping portion of the long run cost curve is",
            options: ["economy of scale", "diseconomy of scale", "diminishing marginal rate of substation", "None of these"],
            correctIndex: 1  // b
          },
          {
            text: "Short run marginal cost of the firm will be increasing when",
            options: ["average cost is decreasing", "total fixed cost is increasing", "average fixed cost is decreasing", "None of these"],
            correctIndex: 3  // d
          },
          {
            text: "Consumer is sovereign under",
            options: ["Free Economy", "Mixed Economy", "Controlled Economy", "Both a and b"],
            correctIndex: 3  // d
          },
          {
            text: "Demand curve under Oligopoly is",
            options: ["Less Elastic", "Perfectly Elastic", "Highly Elastic", "Indeterminate"],
            correctIndex: 3  // d
          },
          {
            text: "The substitution effect for a fall in the price of a commodity ceteris paribus is given by",
            options: ["a movement up a given indifference curve,", "a movement from a higher to a lower indifference curve,", "a movement down a given indifference curve,", "any of the above."],
            correctIndex: 2  // c
          },
          {
            text: "Who gave the theory of price discrimination?",
            options: ["Marshall", "Pigou", "Cournot", "Simon"],
            correctIndex: 1  // b
          },
          {
            text: "At the shut-down point",
            options: ["P = AVC", "TR = TVC", "the total losses of the firm equal TFC", "all of the above."],
            correctIndex: 3  // d
          },
          {
            text: "Total utility is maximum when",
            options: ["marginal utility is zero", "marginal utility is at its highest point", "marginal utility is equal to average utility", "average utility is maximum"],
            correctIndex: 0  // a
          },
          {
            text: "The consumer is in equilibrium at a point where the budget line",
            options: ["is above an indifference curve", "is below an indifference curve", "is tangent to an indifference curve", "cuts an indifference curve"],
            correctIndex: 2  // c
          },
          {
            text: "An indifference curve slopes down towards right since more of one commodity and less of another result in",
            options: ["same satisfaction", "greater satisfaction", "maximum satisfaction", "decreasing expenditure"],
            correctIndex: 0  // a
          },
          {
            text: "The consumer is in equilibrium when the following condition is satisfied",
            options: ["MUx/Px = MUy/Py", "MUx/Py = MUy/Px", "MUx/Px > MUy/Py", "None of the above"],
            correctIndex: 0  // a
          },
          {
            text: "In the case of a Giffen good, the demand curve will be",
            options: ["horizontal", "downward-sloping to the right", "upward-sloping to the right", "vertical"],
            correctIndex: 2  // c
          },
          {
            text: "Which of the following is not an essential condition of pure competition?",
            options: ["large number of buyers and sellers", "homogeneous product", "freedom of entry", "absence of transport cost"],
            correctIndex: 3  // d
          },
          {
            text: "Which is the first order condition for the profit of a firm to be maximum?",
            options: ["AC = MR", "MC = MR", "MR = AR", "AC = AR"],
            correctIndex: 1  // b
          },
          {
            text: "In which form of the market structure is the degree of control over the price of its products by a firm very large?",
            options: ["monopoly", "imperfect competition", "oligopoly", "perfect competition"],
            correctIndex: 0  // a
          },
              {
            text: "Under which of the following forms of market structure does a firm have no control over the price of its product?",
            options: ["monopoly", "monopolistic competition", "oligopoly", "perfect competition"],
            correctIndex: 3  // d
          },
          {
            text: "The net value-added method of measuring national income is also known as",
            options: ["net output method", "production method", "industry of origin method", "all of the above."],
            correctIndex: 3  // d
          },
          {
            text: "Which of the following is incorrect?",
            options: [
              "GDP at market price = GDP at factor cost plus net indirect taxes",
              "NNP at factor cost = NNP at market price minus indirect taxes",
              "GNP at market price = GDP at market price plus net factor income from abroad",
              "None of the above"
            ],
            correctIndex: 3  // d
          },
          {
            text: "Nearly __ percent of working population is engaged in the service sector",
            options: ["23 per cent", "45 per cent", "80 per cent", "50 per cent"],
            correctIndex: 2  // c
          },
          {
            text: "The industrial sector depends on the agricultural sector because",
            options: [
              "the agricultural sector provides food and other products for the consumption purposes of industrial sector",
              "the agricultural sector provides raw materials for the development of agro-based industries of the economy",
              "the agricultural sector provides market for the industrial products",
              "all of the above."
            ],
            correctIndex: 3  // d
          },
          {
            text: "The Indian industry faced the process of retrogression and deceleration because of",
            options: [
              "unsatisfactory performance of agriculture",
              "slackening of real investment in public sector",
              "narrow market for industrial goods, especially in rural areas",
              "all of the above."
            ],
            correctIndex: 3  // d
          },
          {
            text: "Which of the following statements is incorrect?",
            options: [
              "About 80 per cent of agricultural area has irrigation facilities",
              "About two third area is rain-fed in India",
              "Productivity per worker in agriculture is much lower than that in industry",
              "Cropping pattern is quite skewed in India."
            ],
            correctIndex: 0  // a
          },
          {
            text: "We can say Indian agriculture has become modern since",
            options: [
              "there has been an increase in the use of high yielding varieties of seeds, fertilizers pesticides etc.",
              "there has been noticeable positive change in the attitude of farmers towards new techniques of production",
              "farmers are increasingly resorting to intensive cultivation, multiple cropping, scientific water management",
              "all of the above."
            ],
            correctIndex: 3  // d
          },
          {
            text: "Generally, an economy is considered underdeveloped if",
            options: [
              "the standard of living of people is low and productivity is also considerably low.",
              "agriculture is the main occupation of the people and productivity in agriculture is quite low",
              "the production techniques are backward",
              "all of the above"
            ],
            correctIndex: 3  // d
          },
          {
            text: "__ is the apex bank for agriculture credit in India.",
            options: ["RBI", "SIDBI", "NABARD", "ICICI"],
            correctIndex: 2  // c
          },
          {
            text: "The major cause of unemployment in India is",
            options: ["underdevelopment", "defective manpower planning", "rapid population growth", "all of the above"],
            correctIndex: 3  // d
          },
          {
            text: "The largest share of foreign aid in India has been used in the programme of",
            options: ["agriculture development", "industrial development", "education", "health"],
            correctIndex: 1  // b
          },
          {
            text: "Before financial reforms, the banking system was characterised by all of the following except",
            options: [
              "administered interest rate structure",
              "quantitative restrictions on credit flow",
              "high revenue requirements",
              "keeping very less lendable resources for the priority sector"
            ],
            correctIndex: 3  // d
          },
          {
            text: "The demand curve facing an industrial firm under monopoly is a/an",
            options: ["horizontal straight line", "indeterminate", "downward sloping", "upward sloping"],
            correctIndex: 2  // c
          },
          {
            text: "The degree of monopoly power is measured in terms of difference between",
            options: [
              "Marginal cost and the price",
              "Average cost and average revenue",
              "Marginal cost and average cost",
              "Marginal revenue and average cost"
            ],
            correctIndex: 0  // a
          },
          {
            text: "A monopoly producer usually earns even in the long run.",
            options: ["super normal profits", "only normal profits", "losses", "none of the above"],
            correctIndex: 0  // a
          },
          {
            text: "Price discrimination is not possible",
            options: [
              "under monopoly situation",
              "under any market form",
              "under monopolistic competition",
              "under perfect competition"
            ],
            correctIndex: 3  // d
          },
          {
            text: "Discriminating monopoly is possible if two markets have",
            options: [
              "rising cost curves",
              "rising and declining cost curves",
              "different elasticities of demand",
              "equal elasticities of demand"
            ],
            correctIndex: 2  // c
          },
          {
            text: "Consumers surplus left with the consumer under price discrimination is",
            options: ["maximum", "minimum", "zero", "not predictable"],
            correctIndex: 2  // c
          },
          {
            text: "A firm under monopolistic competition advertises",
            options: [
              "as it has no control over the price of its product",
              "to lower its cost of production",
              "to increase its sales and profit",
              "because it cannot raise price"
            ],
            correctIndex: 2  // c
          },
          {
            text: "In short run, a firm in monopolistic competition",
            options: [
              "always earns profits",
              "incurs losses",
              "earns normal profit only",
              "may earn normal profit, super normal profit or incur losses"
            ],
            correctIndex: 3  // d
          },
          {
            text: "In long run, all firms in monopolistic competition",
            options: [
              "earn super normal profits",
              "earn normal profits",
              "incur losses",
              "may earn super normal profit, normal profit or incur losses"
            ],
            correctIndex: 1  // b
          },
          {
            text: "In terms of Ease of Doing Business in 2020 India ranks",
            options: ["63", "75", "45", "None of these"],
            correctIndex: 0  // a
          }
        ]
      },
      {
        id: "eco_mtp1_sep25",
        name: "MTP I Sep 2025",
        type: "MTP",
        questions: [
          {
            text: "Bank Rate is the rate",
            options: ["At which RBI lends to the commercial banks", "At which RBI rediscounts the bills of the commercial banks", "Both a and b", "Neither a nor b"],
            correctIndex: 2 // c
          },
          {
            text: "Which of the following is NOT an instrument of monetary policy?",
            options: ["Cash Reserve Ratio", "Statutory Liquidity Ratio", "Public Expenditure Management", "Repo Rate"],
            correctIndex: 2 // c
          },
          {
            text: "Reverse Repo Rate is",
            options: ["Rate at which RBI borrows from commercial banks", "Rate at which RBI lends to the commercial banks", "Both a and b", "Neither a nor b"],
            correctIndex: 0 // a
          },
          {
            text: "Fiscal deficit can be remedied by",
            options: ["Borrowing money", "Printing Currency", "Both a and b", "Neither a nor b"],
            correctIndex: 2 // c
          },
          {
            text: "Which of the following Budget documents is mandated by Fiscal Responsibility and Budget Management Act, 2003?",
            options: ["Annual Financial Statement (AFS)", "Demand for Grants", "Finance Bill", "Macro-Economic Framework Statement"],
            correctIndex: 3 // d
          },
          {
            text: "NonPlan Grants are determined by",
            options: ["Planning Commission", "Finance Commission", "Central Government", "State Government"],
            correctIndex: 2 // c
          },
          {
            text: "Public Debt Management refers to",
            options: ["Terms of new bonds", "Proportion of different components of public debt", "Maturity", "All the above"],
            correctIndex: 3 // d
          },
          {
            text: "Public Expenditure increases",
            options: ["Interest rate", "Employment", "Exports", "Imports"],
            correctIndex: 1 // b
          },
          {
            text: "Which of the following are the instruments of money market?",
            options: ["Call money", "Certificate of deposits", "Trade bills", "All of the above"],
            correctIndex: 0 // a
          },
          {
            text: "Who issues a treasury bill?",
            options: ["Any nationalised bank", "Any private sector bank", "Reserve Bank of India", "All of the above"],
            correctIndex: 2 // c
          },
          {
            text: "It is a method by which banks borrow from each other to be able to maintain the cash reserve ratio.",
            options: ["Commercial bill", "Commercial papers", "Call money", "None of the above"],
            correctIndex: 1 // b
          },
          {
            text: "The Dumping word refers to",
            options: [
              "Tariffs should be cut to make more money.",
              "A lower-priced sale of goods abroad is below the cost and price of their home market.",
              "Buying goods at low prices in another country and selling them at a higher price here.",
              "Expensive goods are being sold at low prices."
            ],
            correctIndex: 3 // d
          },
          {
            text: "The margin for a currency long term must be retained with the repository by",
            options: ["The buyer", "The seller", "Both the buyer and the seller", "None"],
            correctIndex: 2 // c
          },
          {
            text: "Money cost is considered by",
            options: ["Modern theory of trade", "Comparative cost advantage", "New Trade theory", "Factor equalization theorem"],
            correctIndex: 0 // a
          },
          {
            text: "Factor abundance is considered to be part of international trade",
            options: [
              "Heckscher Ohlin theory of international trade",
              "Comparative cost advantage theory",
              "New Trade theory",
              "Factor Equalization theorem"
            ],
            correctIndex: 0 // a
          },
          {
            text: "The most controversial topic in the Doha Agenda?",
            options: ["Agriculture", "Industry", "Service", "None of these"],
            correctIndex: 0 // a
          },
          {
            text: "Hedging is indicated by",
            options: ["Transaction in odd amounts", "Presentation in documentary support", "Frequency of such transactions", "None of these"],
            correctIndex: 3 // d
          },
          {
            text: "In the long run _____ affect the exchange rate",
            options: ["Transaction in odd amount", "Presentation of documentary support", "Frequency of such transaction", "None of these"],
            correctIndex: 3 // d
          },
          {
            text: "India's foreign exchange rate system is",
            options: ["Free Float", "Managed Float", "Fixed", "Fixed target of bank"],
            correctIndex: 1 // b
          },
          {
            text: "Which of the following measures of money supply is known as Broad Money?",
            options: ["M1", "M2", "M3", "M4"],
            correctIndex: 2 // c
          },
          {
            text: "Which one is not true regarding the Market Stabilization Scheme (MSS)?",
            options: [
              "It absorbs surplus liquidity of enduring nature arising out of large capital flows",
              "It absorbs surplus liquidity through sale of short, dated government securities and treasury bills",
              "Mobilised surplus liquidity is held in the MSS accounts with the RBI",
              "MSS account liquidity can be used for normal government expenditure of capital nature"
            ],
            correctIndex: 3 // d
          },
          {
            text: "Business Economics is",
            options: ["A normative science", "Interdisciplinary", "Pragmatic", "All the above"],
            correctIndex: 3 // d
          },
          {
            text: "In the free market economy the allocation of resources is determined by ______",
            options: ["voting done by consumers", "A Central Planning Authority", "Consumer Preferences", "The level of profits of firms"],
            correctIndex: 2 // c
          },
          {
            text: "Unlimited ends and limited means together present the problem of ____",
            options: ["Scarcity of Resources", "Distribution", "Choice", "None of these"],
            correctIndex: 2 // c
          },
          {
            text: "When two goods are complementary to each other the cross elasticity between them is",
            options: ["Negative", "Positive", "Constant", "None of these"],
            correctIndex: 0 // a
          },
          {
            text: "The Indifference curve analysis is superior to utility analysis",
            options: [
              "It dispenses with the assumption of measurability of Utility",
              "It studies more than one commodity at a time",
              "It segregate income effect from substitution effect",
              "All the above"
            ],
            correctIndex: 3 // d
          },
          {
            text: "Comfort lie between",
            options: ["Inferior goods and necessities", "Luxuries and Inferior good", "necessities and Luxuries", "None of the above"],
            correctIndex: 2 // c
          },
          {
            text: "How would that budget line be affected if the price of both goods fell?",
            options: [
              "The budget line could not shift",
              "The new budget line must be parallel to the old budget line",
              "The new budget line will have the same slope as the original so long as the prices of both goods change in the same proportion",
              "None of these"
            ],
            correctIndex: 2 // c
          },
          {
            text: "Exception to the law of demand includes ____",
            options: ["Giffen goods", "Speculative goods", "Conspicuous necessities", "All the above"],
            correctIndex: 3 // d
          },
          {
            text: "What are the Characteristics of labour?",
            options: ["Labour is perishable", "Labour is an active", "Labour is mobile", "All the above"],
            correctIndex: 3 // d
          },
          {
                  text: "A consumer buys 80 units of a good at a price of 4 per unit. Suppose the price elasticity of demand is -4. At what prices will he buys 60 units.",
                  options: ["4.2 per unit", "3.8 per unit", "4 per unit", "None of these"],
                  correctIndex: 0  // a
                },
                {
                  text: "A vertical supply curve parallel to Y axis implies that the elasticity of supply is",
                  options: ["Zero", "Infinity", "Equal to One", "None of these"],
                  correctIndex: 0  // a
                },
                {
                  text: "In the third of three stages of Production",
                  options: ["The marginal Product curve had a positive slope", "The marginal product curve lies completely below the average product curve", "The Total Product Increases", "None of these"],
                  correctIndex: 1  // b
                },
                {
                  text: "Time element was conceived by",
                  options: ["Adam Smith", "Alfred Marshall", "Pigou", "None of these"],
                  correctIndex: 1  // b
                },
                {
                  text: "The Firm and the Industry are one and the same in",
                  options: ["Perfect Competition", "Monopolistic Competition", "Monopoly", "Oligopoly"],
                  correctIndex: 2  // c
                },
                {
                  text: "A rational person does not act unless",
                  options: ["The action is ethical", "The action produces marginal costs that exceed marginal benefit", "The action makes money for the person", "The marginal benefits that exceed marginal cost"],
                  correctIndex: 3  // d
                },
                {
                  text: "The Structure of the Cold drink Industry in India is best described as",
                  options: ["Perfectly Competitive", "Monopolistic", "Oligopolistic", "Monopolistically Competitive"],
                  correctIndex: 2  // c
                },
                {
                  text: "In the long run equilibrium, the pure monopolist can make pure profits because of",
                  options: ["Blocked entry", "The high price he charges", "The Low LAC Costs", "Advertising"],
                  correctIndex: 0  // a
                },
                {
                  text: "Full capacity is utilized only when there is",
                  options: ["Monopoly", "Perfect Competition", "Price discrimination", "Oligopoly"],
                  correctIndex: 1  // b
                },
                {
                  text: "The Kinked demand hypothesis is designed to explain in the context of oligopoly",
                  options: ["Price and output determination", "Price rigidity", "Collusion among rivals", "None of these"],
                  correctIndex: 1  // b
                },
                {
                  text: "Which of the following is not a variable in the Index of leading indicators",
                  options: ["New consumer good orders", "Prime rate", "New building permits", "None of these"],
                  correctIndex: 3  // d
                },
                {
                  text: "The main thrust of New Industrial Policy is to invite greater participation of",
                  options: ["Public sector", "Private sector", "Stock Holders", "Bank"],
                  correctIndex: 1  // b
                },
                {
                  text: "Pump Priming should be resorted to at the time of",
                  options: ["Inflation", "Deflation", "Reflation", "Stagflation"],
                  correctIndex: 1  // b
                },
                {
                  text: "The expansion of the government debt could result in",
                  options: ["A decline in savings", "An increase in interest", "A decline in Investment", "All the above"],
                  correctIndex: 3  // d
                },
                {
                  text: "Psychological law of consumption is given by",
                  options: ["Milton Friedman", "Pigou", "Tobin", "Keynes"],
                  correctIndex: 3  // d
                },
                {
                  text: "One of the most important factors in trade reforms is to",
                  options: ["Increase export duties", "Reduce import duties", "Keep export duties constant", "Keep import duties constant"],
                  correctIndex: 1  // b
                },
                {
                  text: "Fiscal Policy relates to government decision in respect of i) Taxation ii) Government spending iii) Government borrowing iv) Public debt",
                  options: ["iii and iv are correct", "ii, iii, iv", "i and ii are correct", "All the above are correct"],
                  correctIndex: 3  // d
                },
                {
                  text: "An agreement between two countries to maintain a free trade area, a common external tariff free mobility of capital and labour and degree of unification in government policies and monetary policy is called",
                  options: ["Common market", "Free Trade Area", "Economic Union", "Custom Union"],
                  correctIndex: 2  // c
                },
                {
                  text: "Margin requirement specified under instrument of monetary policy",
                  options: ["Variable reserve requirement", "Statutory liquidity requirement", "Selective credit control", "Open market operation"],
                  correctIndex: 2  // c
                },
                {
                  text: "High growth of which Industry provide a positive signal for Industrial Growth in Future?",
                  options: ["Capital good industries", "Basic good industries", "Durable consumer good industries", "Intermediate good Industries"],
                  correctIndex: 0  // a
                },
                {
                  text: "Even as fixed average cost continues to fall the average variable cost begins to rise because",
                  options: ["return to factor start diminishing", "return to factor start rising", "input price start rising", "producer budget starts shrinking"],
                  correctIndex: 0  // a
                },
                {
                  text: "Adverse Selection arises because of",
                  options: ["Lack of information", "Wrong Information", "Asymmetrical Information", "Uncertainty of future"],
                  correctIndex: 2  // c
                },
                {
                  text: "Which of the following is not used to measure inflation?",
                  options: ["Wholesale Price Index Number", "Consumer Price Index number", "Purchasing Power Parity Prices", "GDP deflator"],
                  correctIndex: 2  // c
                },
                {
                  text: "Public goods are characterized by 1) Collective Consumption 2) Divisibility 3) Non-Exclusion 4) Rival Consumption Select the correct answer from the code given below",
                  options: ["1 & 2 are correct", "1 & 3 are correct", "1 & 4 are correct", "2 & 4 are correct"],
                  correctIndex: 1  // b
                },
                {
                  text: "Giffen Paradox occurs when income effect is",
                  options: ["Greater than the substitution effect", "Equal to the substitution effect", "Less than substitution effect", "Negative and is greater than substitution effect"],
                  correctIndex: 3  // d
                },
                {
                  text: "In case of deficit budget when the deficit are covered through taxes that budget is called",
                  options: ["Unbalanced budget", "Surplus budget", "Balanced budget", "None of these"],
                  correctIndex: 2  // c
                },
                {
                  text: "Which of the following is credited with Introduction of LPG Model of economic development in India?",
                  options: ["Dr. C Rangarajan", "Dr. Montek Singh Ahluwalia", "Dr. Manmohan Singh", "None of these"],
                  correctIndex: 2  // c
                },
                {
                  text: "In which of the following market situations/forms, firms are able to maximise profits?",
                  options: ["Price Leadership", "Cartel", "At the Kink Point", "Monopolistic Competition"],
                  correctIndex: 3  // d
                },
              {
      text: "The slope of aggregate demand becomes flatter?",
      options: [
        "The more sensitive investment spending is to the rate of interest",
        "The more sensitive the demand for money is to the rate of interest",
        "The larger the nominal money supply",
        "None of these"
      ],
      correctIndex: 0  // a
    },
    {
      text: "When exchange rate is flexible a decrease in country B's taxes",
      options: [
        "Has no effect upon output in country B",
        "Causes output in country B to increase",
        "Results in an increase in country B's export",
        "None of these"
      ],
      correctIndex: 0  // a
    },
    {
      text: "Crowding Out occurs when ______",
      options: [
        "A decrease in the money supply raises the rate of interest which crowds out interest sensitive private sector spending",
        "An increase in taxes for the private sector reduces private sector disposable income and spending",
        "A reduction in income taxes results in a higher interest rate which crowds out interest sensitive private sector spending",
        "None of these"
      ],
      correctIndex: 2  // c
    },
    {
      text: "A change in autonomous spending is represented by",
      options: [
        "A movement along CIG spending line",
        "A shift of a CIG spending line",
        "A change in the behavioural coefficient",
        "None of these"
      ],
      correctIndex: 1  // b
    },
    {
      text: "In mixed economy the feature include existence of",
      options: ["Private Sector", "Public Sector", "Combined Sector", "All of these"],
      correctIndex: 3  // d
    },
    {
      text: "Which of the following is demerit of capitalism",
      options: [
        "There is precedence of property rights over human right",
        "It functions in a domestic framework",
        "High degree of operative efficiency",
        "None of these"
      ],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is included in study of Micro Economics",
      options: ["Product Pricing", "Factor Pricing", "Both a and b", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Scarcity definition is economics is given by",
      options: ["Lipsey", "Adam Smith", "J B Say", "Robinson"],
      correctIndex: 3  // d
    },
    {
      text: "Snob effect is explained as",
      options: [
        "It is a function of consumption of others",
        "It is a function of price",
        "Both a and b",
        "None of these"
      ],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following are the determinant of price elasticity of demand",
      options: ["Availability of substitutes", "Time period", "Tied demand", "All of these"],
      correctIndex: 3  // d
    },
    {
      text: "If the cross elasticity is only- slightly below zero which of the following is correct?",
      options: [
        "They are weak complements",
        "Negative and very high they are strong complements",
        "Both a and b",
        "None of these"
      ],
      correctIndex: 0  // a
    },
    {
      text: "Indifference Curve Analysis was proposed by _____",
      options: ["J. R Hicks and R.G.D Allen", "Alfred Marshall", "Jeremy Bentham", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "The rate at which the consumer is prepared to exchange-good x and y is",
      options: ["Marginal rate of Substitution", "Elasticity of Substitution", "Diminishing Marginal Utility", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Contraction of demand is the result of",
      options: [
        "Decrease in the number of consumers",
        "Increase in the price of the good concerned",
        "Price of related products",
        "None of these"
      ],
      correctIndex: 1  // b
    },
    {
      text: "Economic indicator required to predict the turning point of business cycle is",
      options: ["Leading Indicator", "Lagging Indicator", "Coincident Indicator", "All the above"],
      correctIndex: 0  // a
    },
    {
      text: "Empirical evidence of liquidity trap is found during",
      options: ["COVID 19", "Great Recession", "Global Financial Crisis", "None of the above"],
      correctIndex: 2  // c
    },
    {
      text: "New Trade Theory was developed in",
      options: ["1919", "1970", "2008", "1991"],
      correctIndex: 1  // b
    },
    {
      text: "Which one is included in National Income?",
      options: ["Transfer Earnings", "Sale proceeds of Shares and Bonds", "Black Money", "None of the Above"],
      correctIndex: 3  // d
    },
    {
      text: "The major reasons for market failure is",
      options: ["Market Power", "Externalities", "Incomplete Information", "All the above"],
      correctIndex: 3  // d
    },
    {
      text: "Which of the following instrument is not FDI Compliant Instrument",
      options: ["Equity Shares", "Compulsorily Convertible Debentures", "Redeemable Preference Share", "None of the above"],
      correctIndex: 2  // c
    },
    {
      text: "An expansionary fiscal policy is used for",
      options: [
        "Reduction in Inflation",
        "Increase in Exports.",
        "Appreciation of Currency",
        "Close recessionary gap"
      ],
      correctIndex: 3  // d
    },
    {
      text: "What is GDP Deflector?",
      options: [
        "It is GDP of Base Year",
        "It is ratio of nominal GDP in a given year to real GDP of that year",
        "It is GDP at current price",
        "It is GDP of current year at base year price"
      ],
      correctIndex: 1  // b
    },
    {
      text: "An increase in the price of a commodity when demand is inelastic causes the total expenditures of consumers of the commodity to",
      options: ["Increase", "Decrease,", "Remain unchanged,", "any of the above."],
      correctIndex: 0  // a
    },
    {
      text: "At the point of producer equilibrium",
      options: [
        "The isoquant is tangent to the isocost,",
        "The MRTSLK equals PL/PK,",
        "MPL/PL = MPK/PK,",
        "All of the above."
      ],
      correctIndex: 3  // d
    },
    {
      text: "Price varies by attributes such as location or by customer segment is ____ degree of price discrimination",
      options: ["First", "Second", "Third", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "The Idea of ____ in economics is that we have unlimited wants but limited resources",
      options: ["Opportunity Costs.", "Scarcity", "Marginal Analysis", "Specialization"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is a key assumption of the monopoly model?",
      options: [
        "Barriers to entry",
        "A product with several substitutes",
        "Price-taking behavior",
        "Many identical producers"
      ],
      correctIndex: 0  // a
    },
        {
      text: "What is the full form of LIFE?",
      options: ["Lifestyle for Economy", "Life for Everyone", "Lifestyle for Environment", "Living in Financial Equality"],
      correctIndex: 2  // c
    },
    {
      text: "Which program was launched to promote organic farming?",
      options: ["MIDH", "PMFBY", "PKVY", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following is a non-tariff barrier?",
      options: ["Ad valorem duty", "Quotas", "Countervailing duty", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "Most-Favoured Nation (MFN) principle under WTO means",
      options: ["Preferential tariffs for allies", "Equal treatment to all members", "Protection to domestic producers", "All of these"],
      correctIndex: 1  // b
    },
    {
      text: "Which agreement replaced GATT and created WTO?",
      options: ["Doha Round", "Tokyo Round", "Uruguay Round", "Marrakesh Protocol"],
      correctIndex: 2  // c
    },
    {
      text: "What is a liquidity trap?",
      options: ["Money becomes illiquid due to inflation", "Money supply becomes ineffective at zero interest rate", "Interest rate becomes infinite", "All the above"],
      correctIndex: 1  // b
    },
    {
      text: "According to Friedman, the key determinant of money demand is",
      options: ["Current Income", "Future expectations only", "Permanent Income", "Government Spending"],
      correctIndex: 2  // c
    },
    {
      text: "According to Baumol, cash balances are kept to",
      options: ["Invest in stock", "Earn capital gains", "Minimize total transaction cost", "Hedge inflation"],
      correctIndex: 2  // c
    },
    {
      text: "When demand increases and supply remains constant, what happens to equilibrium price?",
      options: ["Falls", "Rises", "Remains same", "Cannot say"],
      correctIndex: 1  // b
    },
    {
      text: "Mixed income of self-employed includes",
      options: ["Rent and Interest only", "Wages only", "Capital and Labour income that cannot be separated", "Only profit"],
      correctIndex: 2  // c
    },
    {
      text: "The LAC curve is also known as",
      options: ["Shut down curve", "Expansion path", "Planning curve", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Fiscal federalism refers to",
      options: ["Sharing of political power", "Sharing of fiscal functions and resources", "Decentralization of planning", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "The percentage of Central tax share for 2021-26 is",
      options: ["38%", "41%", "46%", "Not decided"],
      correctIndex: 1  // b
    },
    {
      text: "Liquidity Adjustment Facility (LAF) includes",
      options: ["Only Repo", "Repo and Reverse Repo", "Only Reverse Repo", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "The Monetary Policy Committee Sets",
      options: ["SLR", "CRR", "Repo rate", "Bank rate"],
      correctIndex: 2  // c
    }
        ]
      },
      {
  id: "eco_mtp1_may25",
  name: "MTP I May 2025",
  type: "MTP",
  questions: [
    {
      text: "Which of the following statements is correct regarding business cycles?",
      options: ["Business cycles always affect all sectors uniformly.", "Business cycles may affect all sectors uniformly.", "Business cycles do not affect all sectors uniformly.", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Business cycle emerge in ____",
      options: ["Socialist economy", "Free market economy", "Mixed economic system", "None of the above"],
      correctIndex: 1  // b
    },
    {
      text: "If the price elasticity of demand of a product is -3, what should be the price of the product for its MR to be 20?",
      options: ["10 unit", "20 unit", "30 unit", "40 unit"],
      correctIndex: 2  // c
    },
    {
      text: "While drawing budget line of a consumer consuming Nachos chips and Pepsi, if the quantity of Nachos taken on Y-axis and quantity of Pepsi on X-axis. The slope of budget line will be-",
      options: ["PP/PN", "PN/PP", "M/PN", "M/PP"],
      correctIndex: 0  // a
    },
    {
      text: "Theory of Mercantilism propagates",
      options: ["Encourage exports and imports", "Encourage exports and discourage imports", "Discourage exports and imports", "Discourage exports and encourage imports"],
      correctIndex: 1  // b
    },
    {
      text: "EVA digital assistance Robot of HDFC Bank is",
      options: ["An intermediate good", "A consumer good", "A capital good", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following statement is incorrect, - In the simple Keynesian model, -",
      options: ["MPC+MPS=1", "APC+APS=1", "Both a and b", "Neither a nor b."],
      correctIndex: 3  // d
    },
    {
      text: "National income accountants can avoid multiple counting by",
      options: ["including transfers in their calculations.", "counting both intermediate and final goods.", "only counting final goods.", "only counting intermediate goods."],
      correctIndex: 2  // c
    },
    {
      text: "Gross investment refers to",
      options: ["private investment minus public investment.", "net investment plus replacement investment.", "net investment after it has been inflated for changes in the price level.", "net investment plus net exports"],
      correctIndex: 1  // b
    },
    {
      text: "The largest component of national income is",
      options: ["compensation of employees.", "rents.", "interest.", "corporate profits."],
      correctIndex: 0  // a
    },
    {
      text: "Transfer payments are",
      options: ["excluded when calculating GDP because they only reflect inflation.", "excluded when calculating GDP because they do not reflect current production.", "included when calculating GDP because they are a category of investment spending.", "included when calculating GDP because they increase the spending of recipients."],
      correctIndex: 1  // b
    },
    {
      text: "Price Floor is the price fixed by the government, which is",
      options: ["Equal to Equilibrium Price", "Below the Equilibrium Price", "Above the Equilibrium Price", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "When actual price of a commodity is less than equilibrium price, its price",
      options: ["starts rising", "starts falling", "starts fluctuating", "remains constant"],
      correctIndex: 0  // a
    },
    {
      text: "The cost which is never zero even when production is stopped is known as",
      options: ["Supplementary Cost", "Prime Cost", "Explicit cost", "Implicit cost"],
      correctIndex: 0  // a
    },
    {
      text: "At the Point of Inflexion",
      options: ["Total Product is maximum", "Average Product is maximum", "Marginal Product is maximum", "Marginal Product is zero"],
      correctIndex: 2  // c
    },
    {
      text: "The Indian Government imposed heavy taxes on commodity to reduce its consumption by the public. Such heavy taxes will decrease the demand of the commodity only when",
      options: ["ed = 0", "ed > 1", "Ed = 1", "ed < 1"],
      correctIndex: 1  // b
    },
        {
      text: "What does the term cascading effect in taxation refer to?",
      options: ["Tax on tax, leading to increased costs", "Double taxation of the same income", "A uniform tax rate across all commodities", "A system where indirect taxes are completely avoided"],
      correctIndex: 0  // a
    },
    {
      text: "Which characteristic of money refers to its ability to hold value over time?",
      options: ["Divisibility", "Durability", "Portability", "Store of value"],
      correctIndex: 3  // d
    },
    {
      text: "What is the purpose of a capital budget?",
      options: ["Funding day-to-day government operations", "Financing long-term investments and projects", "Managing short-term financial needs", "Controlling inflation"],
      correctIndex: 1  // b
    },
    {
      text: "According to Keynes, what is the role of the government in maintaining full employment?",
      options: ["Limited role, as the market will self-adjust", "Active role through fiscal and monetary policies", "Passive role, focusing on international trade", "No role, as unemployment is a natural part of the business cycle"],
      correctIndex: 1  // b
    },
    {
      text: "Keynesian economics emphasizes the importance of",
      options: ["Market self-regulation", "Government intervention", "International trade", "Laissez-faire policies"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following factors does NOT directly affect the demand for money?",
      options: ["Interest rates", "The level of income or output", "The price level in the economy", "The government's fiscal deficit"],
      correctIndex: 3  // d
    },
    {
      text: "In an economy, a change in the reserve ratio will directly affect the",
      options: ["Level of interest rates in the market", "Supply of money in circulation", "Demand for money at different income levels", "Government's budgetary balance"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following budget types specifically aims to reduce the deficit by either increasing taxes or reducing government spending?",
      options: ["Balanced budget", "Expansionary budget", "Contractionary budget", "Surplus budget"],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following is the most important source of India's foreign exchange earnings?",
      options: ["Industrial exports", "Remittances from Indians working abroad", "Tourism", "Services exports, especially IT and software"],
      correctIndex: 1  // b
    },
    {
      text: "The Green Revolution in India focused primarily on increasing the production of",
      options: ["Oilseeds", "Food grains, especially wheat and rice", "Fruits and vegetables", "Cash crops like cotton and sugarcane"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is a primary objective of India's Five-Year Plans?",
      options: ["To regulate and control foreign trade", "To promote balanced economic growth across all regions", "To discourage the private sector in favor of public enterprises", "To ensure foreign aid and capital inflows into the country"],
      correctIndex: 1  // b
    },
    {
      text: "In international trade negotiations, which of the following is the most common objective for countries involved in multilateral trade talks?",
      options: ["To increase tariffs and protect domestic industries", "To reduce trade barriers and promote free trade", "To restrict foreign competition through quotas", "To enhance domestic subsidies for agricultural sectors"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is NOT a key assumption of Ricardo's theory of comparative advantage?",
      options: ["Two countries, each specializing in the good it can produce most efficiently, will both gain from trade.", "Resources are immobile between countries but mobile within a country.", "Trade occurs only due to differences in technology between countries.", "Both countries in trade can benefit even if one country is less efficient in producing both goods."],
      correctIndex: 2  // c
    },
    {
      text: "According to the Quantity Theory of Money, if the money supply increases while the velocity of money and output remain constant, the general price level will",
      options: ["Decrease", "Increase proportionately", "Stay the same", "Increase, but unpredictably"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following situations best demonstrates a market failure due to asymmetric information?",
      options: ["A monopolist exploiting market power by reducing supply", "Consumers buying substandard products because they lack information about quality", "The government providing public goods like street lighting", "A natural monopoly where economies of scale drive market concentration"],
      correctIndex: 1  // b
    },
    {
      text: "When a market fails to allocate resources efficiently, leading to overproduction or underproduction of goods, it is called",
      options: ["Monopoly", "Externalities", "Public Goods", "Market Equilibrium"],
      correctIndex: 1  // b
    },
    {
      text: "When e = 1 the MR is",
      options: ["One", "Negative", "Positive", "Zero"],
      correctIndex: 3  // d
    },
    {
      text: "Price discrimination will be profitable only if the elasticity of demand in different sub market is",
      options: ["different", "uniform", "zero", "less"],
      correctIndex: 0  // a
    },
    {
      text: "When the Output of the firm increases in the Short run, its average fixed cost",
      options: ["Decreases", "Increases", "First decline and then rise", "remains constant"],
      correctIndex: 0  // a
    },
    {
      text: "A vertical supply curve parallel to Y axis implies that the elasticity of supply is",
      options: ["Infinity", "Zero", "Greater than zero but less than infinity", "Equal to one"],
      correctIndex: 1  // b
    },
    {
      text: "Inequality and Exploitation is minimal under",
      options: ["Mixed economy", "Capitalism", "Socialism", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Comfort lie between",
      options: ["inferior goods and necessities", "luxuries and inferior goods", "necessities and luxury", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following is not a determinant of the firm's cost function?",
      options: ["Taxes", "The Production Function", "The Price of the firm's output", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following is correct about Cartel?",
      options: ["There are few firms", "All of which are similar in size", "Most Cartels have only a Subset of producers", "All of the above"],
      correctIndex: 3  // d
    },
        {
      text: "Secular Period is also known as",
      options: ["Short Period", "Very Long Period", "long Period", "Very short Period"],
      correctIndex: 1  // b
    },
    {
      text: "Price Rigidity explained by Sweezy's model is related to which market form",
      options: ["Monopoly", "Oligopoly", "Monopolistic competition", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "In business cycle peaks and troughs are collectively known as",
      options: ["Turning Points", "Equilibrium Points", "Real business cycle events", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Fluctuation in economic activities according to Keynes are due to",
      options: ["Innovations", "changes in money supply", "Fluctuation in aggregate effective demand", "Fluctuation in government spending"],
      correctIndex: 2  // c
    },
    {
      text: "Demand for Electricity is elastic because",
      options: ["it is very expensive", "it has alternative uses", "it has a number of close Substitute.", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "The effectiveness of fiscal policy is limited by",
      options: ["Time lags in implementation", "Lack of flexibility in government expenditure", "Political constraints", "All of the above"],
      correctIndex: 3  // d
    },
    {
      text: "Internal public debt refers to",
      options: ["Loans taken from international financial institutions", "Government borrowing from domestic sources", "Borrowing from foreign investors", "Foreign direct investment (FDI)"],
      correctIndex: 1  // b
    },
    {
      text: "Redistribution of income by the government is primarily done through",
      options: ["Progressive taxation and social welfare programs", "Privatization of public enterprises", "Increase in indirect taxes", "Encouraging monopolistic practices"],
      correctIndex: 0  // a
    },
    {
      text: "The Finance Commission is responsible for",
      options: ["Allocating financial resources between the Union and the States", "Preparing the Union Budget", "Controlling the Reserve Bank of India", "Regulating stock markets"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is NOT a function of NITI Aayog?",
      options: ["Policy formulation and coordination", "Allocation of financial resources to states", "Promoting cooperative federalism", "Serving as a think tank for the government"],
      correctIndex: 1  // b
    },
    {
      text: "Under Article 112, the Annual Financial Statement is presented in which house of Parliament first?",
      options: ["Lok Sabha", "Rajya Sabha", "Joint Session of Parliament", "Finance Committee"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is a potential benefit of Foreign Direct Investment (FDI) for the host country?",
      options: ["Increased inflation due to higher government expenditure", "Reduction in technological transfer to local industries", "Creation of employment opportunities and skill development", "Increased dependence on foreign companies for resources"],
      correctIndex: 2  // c
    },
    {
      text: "According to the Heckscher-Ohlin theory, a country will have a comparative advantage in the production of goods that",
      options: ["Require labour-intensive techniques if the country has a surplus of capital.", "Utilize abundant factors of production that the country has in large supply.", "Require advanced technology in which the country is technologically superior.", "Require high labor costs in a country with low wages."],
      correctIndex: 1  // b
    },
    {
      text: "Production of milk is included in which sector?",
      options: ["Tertiary sector", "Service sector", "Primary sector", "Secondary sector"],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following is the primary objective of bilateral trade agreements?",
      options: ["To create trade barriers between the two countries involved", "To establish free trade between two countries by eliminating tariffs and restrictions", "To focus on mutual military cooperation between the countries", "To standardize monetary policies between two countries"],
      correctIndex: 1  // b
    },
    {
      text: "Agricultural goods markets depict characteristics close to",
      options: ["Perfect competition.", "Oligopoly.", "Monopoly.", "Monopolistic competition."],
      correctIndex: 0  // a
    },
    {
      text: "Monopsony means ____",
      options: ["Where there are large firms", "There is a single buyer", "Small number of large buyers", "Single seller and single buyer"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is incurred first?",
      options: ["Historical Cost", "Replacement Cost", "Realized Value", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "The Great Depression occurred during",
      options: ["1919-23", "1929-33", "1949-53", "1901-05"],
      correctIndex: 1  // b
    },
    {
      text: "The burden of long-term public debt fall on",
      options: ["Present generation", "Past generation", "Future generation", "All"],
      correctIndex: 2  // c
    },
    {
      text: "The strategy of agricultural development in India before green revolution was",
      options: ["High yielding varieties of seeds and chemical fertilizers to boost productivity", "Institutional reforms such as land reforms", "Technological up gradation of agriculture", "All the above"],
      correctIndex: 1  // b
    },
    {
      text: "The transaction motive for holding money implies that money is held to",
      options: ["Make speculative investments in financial markets", "Provide liquidity for daily transactions and purchases", "Protect wealth against inflationary risks", "Save for future investment in assets"],
      correctIndex: 1  // b
    },
    {
      text: "In the context of trade negotiations, the term Most-Favoured-Nation (MFN) status refers to",
      options: ["A preferential treatment granted to one country over others in trade agreements.", "The obligation to trade exclusively with a particular country.", "A policy that allows countries to impose tariffs on imports from specific nations.", "A requirement to offer the same trade terms to all trading partners."],
      correctIndex: 3  // d
    },
    {
      text: "Which of the following is the most important source of India's foreign exchange earnings?",
      options: ["Industrial exports", "Remittances from Indians working abroad", "Tourism", "Services exports, especially IT and software"],
      correctIndex: 3  // d
    },
    {
      text: "Which of the following statements is correct regarding business cycles?",
      options: ["Business cycles are contagious and international in character.", "Business cycles begin in one country and spread to other countries through trade relations.", "Business cycles have serious consequences on well-being of the societies.", "All of the above"],
      correctIndex: 3  // d
    },
    {
      text: "Decrease in input demand ______",
      options: ["Doesn't affect inputs prices", "Pushes inputs prices up", "Pulls inputs prices down", "Either b or c"],
      correctIndex: 2  // c
    },
    {
      text: "During business cycles the opposite of a peak is ______",
      options: ["an inflation", "a hyperinflation", "a trend", "a trough"],
      correctIndex: 3  // d
    },
    {
      text: "Nicholas Kaldor propounded _____",
      options: ["Nocholas theory", "Kaldor Theory", "Cobweb theory", "Cobb-Douglas theory"],
      correctIndex: 1  // b
    },
    {
      text: "Repercussions of business cycles get _____ felt on nearly all economic variables.",
      options: ["alternatively", "simultaneously", "one by one", "All of the above"],
      correctIndex: 3  // d
    },
        {
      text: "Different business cycles _____ in duration and intensity.",
      options: ["differ", "similar", "consistent", "Cant say"],
      correctIndex: 0  // a
    },
    {
      text: "Peak is ____ the stage of expansion.",
      options: ["Later", "Earlier", "Either A or B", "None of the above"],
      correctIndex: 0  // a
    },
    {
      text: "Which one of the following is not an internal cause of business cycles?",
      options: ["Money supply", "Technology shocks", "Psychological factors", "Fluctuations in investment"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is a differentiated product?",
      options: ["A hamburger", "A shirt", "An automobile", "All of the above"],
      correctIndex: 3  // d
    },
    {
      text: "If the market demand curve for a commodity has a negative slope then the market structure must be",
      options: ["Perfect competition", "Monopoly", "Imperfect competition", "The market structure cannot be determined as the information is insufficient"],
      correctIndex: 2  // c
    },
    {
      text: "The market demand curve for a perfectly competitive industry is Qd = 12 - 2P and the market supply curve is Qs = 3 + P. The market will be in equilibrium if",
      options: ["P = 6 and Q = 9", "P = 5 and Q = 2", "P = 4 and Q = 4", "P = 3 and Q = 6"],
      correctIndex: 0  // a
    },
    {
      text: "The short run supply curve of a perfectly competitive firm is equal to",
      options: [
        "That portion of the short run marginal cost curve that is above the average variable cost curve",
        "That portion of the short run marginal cost curve that is above the average total cost curve",
        "That portion of the short run average total cost curve that is above the average variable cost curve",
        "None of the above is correct."
      ],
      correctIndex: 0  // a
    },
    {
      text: "Marginal revenue is equal to the price under",
      options: ["Monopoly market structure", "Oligopoly form of market", "Monopolistically competitive market", "Perfect competition"],
      correctIndex: 3  // d
    },
    {
      text: "When demand increases and supply decreases,",
      options: [
        "the equilibrium price and quantity both rise",
        "the equilibrium price and quantity both fall",
        "the equilibrium price rises but nothing certain can be said about the change in equilibrium quantity.",
        "the equilibrium quantity rises but nothing certain can be said about the change in equilibrium price."
      ],
      correctIndex: 2  // c
    },
    {
      text: "Isoquant in the relevant range are",
      options: ["Convex to the Origin", "Negatively Sloped", "Cannot cross", "All of the Above"],
      correctIndex: 3  // d
    },
    {
      text: "For Giffen good the angle Curve is",
      options: ["Vertical", "Horizontal", "Negatively Sloped", "Positively Sloped"],
      correctIndex: 3  // d
    },
    {
      text: "Demand for a commodity with negative income elasticity indicates that as income falls the amount of the commodity purchased",
      options: ["falls", "rises", "remain unchanged", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "Normative economics can be explained through",
      options: ["Fairness to tax", "Incidence to tax", "Effect of tax on incentives to work", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Entry of new firm in monopoly is",
      options: ["Possible only in the long run", "Possible only in the short run", "Restricted at all times", "Both a and b"],
      correctIndex: 2  // c
    },
    {
      text: "The market price cannot be influenced by a seller under",
      options: ["Monopolistic Competition", "Monopoly", "Perfect Competition", "All the above"],
      correctIndex: 2  // c
    },
    {
      text: "There is an inverse relation between price and demand for the products of a firm under",
      options: ["Monopoly only", "Monopolistic Competition only", "Both Monopoly and Monopolistic Competition", "Perfect competition"],
      correctIndex: 2  // c
    },
    {
      text: "Price elasticity of demand under monopoly is ____",
      options: ["Infinity", "Equal to one", "Less than one", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Business Economics in its approach is",
      options: ["Pragmatic", "Idealistic", "Normative", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Contraction of demand is the result of",
      options: ["Decrease in the number of Consumers", "Increase in the price of the good concerned", "Price of related products", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "The rate at which the consumer is prepared to exchange-good x and y is",
      options: ["Marginal rate of substitution", "Elasticity of Substitution", "Diminishing Marginal Utility", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Indifference Curve Analysis was proposed by _____",
      options: ["J. R Hicks and R.G.D Allen", "Alfred Marshall", "Jeremy Bentham", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following statement is correct concerning the relationship among the firms cost function",
      options: ["TC = TVC + TFC", "TFC = TC - TVC", "TC = TFC - TVC", "TVC = TFC - TC"],
      correctIndex: 0  // a
    },
    {
      text: "The marginal utility from last unit consumed of commodity Y = 50 Units and MUm = 10. The consumer is in equilibrium and consuming commodity y only. Find the Price of Commodity Y",
      options: ["5", "10", "40", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "The price in collusive oligopoly is decided by",
      options: ["firm", "price leader", "industry", "none of these"],
      correctIndex: 1  // b
    },
    {
      text: "The Government offer minimum assured price to the farmers to purchase their output is called",
      options: ["market Price", "support Price", "equilibrium Price", "ceiling Price"],
      correctIndex: 1  // b
    },
    {
      text: "What are the internal causes of business cycle?",
      options: ["fluctuations in effective demand.", "macroeconomic policies", "money Supply", "All the above"],
      correctIndex: 3  // d
    },
    {
      text: "The substitution effect will be stronger when",
      options: [
        "the goods are closer substitute",
        "there is lower cost of switching to the substitute good.",
        "there is lower inconvenience while switching to the substitute good.",
        "all the above"
      ],
      correctIndex: 3  // d
    },
    {
      text: "Rational decision making requires that",
      options: [
        "one's choice be arrived at logically and without error.",
        "one's choice be consistent with one's goal.",
        "one's choice never vary.",
        "the consumer plans to attain the highest possible level of satisfaction."
      ],
      correctIndex: 3  // d
    },
    {
      text: "Which of these country is a purely socialist economy?",
      options: ["USSR", "China", "Vietnam", "None of these"],
      correctIndex: 3  // d
    },
    {
      text: "The Nature of Business Economics",
      options: [
        "Business Economics is a Science",
        "Incorporate elements of Macro Analysis",
        "Interdisciplinary in Nature",
        "All the above"
      ],
      correctIndex: 3  // d
    },
    {
      text: "The Book The Wealth of Nations is written by",
      options: ["Adam Smith", "Arthur Pigou", "Robinson", "Ragnar Nurske"],
      correctIndex: 0  // a
          }
        ]
        
      },
      {
  id: "eco_rtp_sep25",
  name: "RTP Sep 2025",
  type: "RTP",
  questions: [
    {
      text: "The introduction of the Goods and Services Tax (GST) in India primarily aimed to",
      options: ["Replace direct taxes with indirect taxes", "Unify various indirect taxes into a single system", "Increase the tax burden on lower-income groups", "Eliminate the taxation of services"],
      correctIndex: 1  // b
    },
    {
      text: "Microeconomic theory studies how a free-enterprise economy determines",
      options: ["the price of goods", "the price of services", "the price of economic resources", "all of the above."],
      correctIndex: 3  // d
    },
    {
      text: "Within the relevant range, isoquants",
      options: ["are negatively sloped", "are convex to the origin", "cannot cross", "are all of the above."],
      correctIndex: 3  // d
    },
    {
      text: "Which of the following is incorrect formula?",
      options: ["TC = AC × Q", "MC = ΔTC/ΔQ", "MC = ΔTVC/ΔQ", "MC = ΔTFC/ΔTC"],
      correctIndex: 1  // b
    },
    {
      text: "The Substitution effect will be stronger when",
      options: ["The goods are closer substitution", "There is lower cost of switching to the substitute goods", "There is lower Inconvenience while switching to the substitute good", "All the above"],
      correctIndex: 0  // a
    },
    {
      text: "Price discrimination to be profitable elasticity of demand in different submarket will be",
      options: ["Different", "Uniform", "Zero", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "According to Hicks and Allen the demand curve slope downwards due to",
      options: ["Law of diminishing marginal utility", "Income effect and substitution effect", "Either a or b", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "Full Capacity is utilized in the which market condition",
      options: ["Perfect Competition", "Monopoly", "Oligopoly", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Envelope curve is also called",
      options: ["Long Run Average Cost curve", "Short Run Average Cost curve", "Average Fixed Cost", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Coincident indicator is not indicated as",
      options: ["Inflation", "Industrial Production", "Retail Sales", "New order for Plant and equipment"],
      correctIndex: 3  // d
    },
    {
      text: "Which of the following is NOT typically used as a fiscal policy measure to control inflation?",
      options: ["Increasing government expenditure", "Raising taxes", "Reducing public sector investments", "Increasing interest rates"],
      correctIndex: 3  // d
    },
    {
      text: "In an economy, a change in the reserve ratio will directly affect the",
      options: ["Level of interest rates in the market", "Supply of money in circulation", "Demand for money at different income levels", "Government's budgetary balance"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is NOT a key assumption of Ricardo's theory of comparative advantage?",
      options: ["Two countries, each specializing in the good it can produce most efficiently, will both gain from trade.", "Resources are immobile between countries but mobile within a country.", "Trade occurs only due to differences in technology between countries.", "Both countries in trade can benefit even if one country is less efficient in producing both goods."],
      correctIndex: 2  // c
    },
    {
      text: "If a country's currency is depreciating, it means that",
      options: ["The domestic currency is increasing in value relative to foreign currencies.", "The country's exports will become more expensive to foreign buyers.", "The country's exports become cheaper for foreign buyers, potentially boosting trade.", "The central bank is actively increasing the supply of money."],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following is a primary objective of India's Five-Year Plans?",
      options: ["To regulate and control foreign trade", "To promote balanced economic growth across all regions", "To discourage the private sector in favour of public enterprises", "To ensure foreign aid and capital inflows into the country"],
      correctIndex: 1  // b
    },
    {
      text: "The current account deficit (CAD) in India refers to the excess of",
      options: ["Imports over exports", "Exports over imports", "Total investment over savings", "Government expenditure over revenue"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is a primary objective of India's monetary policy?",
      options: ["To reduce the overall level of taxation in the economy", "To control the money supply and curb inflation", "To promote export-led growth through currency devaluation", "To ensure a balanced budget for the government"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following refers to the study of the total or aggregate level of output, income, employment, consumption, investment, and prices for the economy viewed as a whole?",
      options: ["Managerial economics", "Microeconomics", "Macroeconomics", "Econometrics"],
      correctIndex: 2  // c
    },
    {
      text: "Firms in an industry that produces a differentiated product",
      options: ["are either monopolists or oligopolists.", "are either monopolistically competitive or perfectly competitive.", "are either monopolistically competitive or oligopolists.", "are either perfectly competitive or oligopolists."],
      correctIndex: 2  // c
    },
    {
      text: "The concept of the multiplier effect in Keynesian economics refers to",
      options: ["The impact of interest rates on investment", "The magnification of an initial change in spending throughout the economy", "The impact of taxes on consumer spending", "The role of exports in economic growth"],
      correctIndex: 1  // b
    },
    {
      text: "What is the primary method for calculating National Income using the income approach?",
      options: ["Adding up all expenditures in the economy", "Summing up all factor incomes earned by households and firms", "Measuring the value added at each stage of production", "Calculating the difference between exports and imports"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is considered a component of M1, the narrowest definition of money supply?",
      options: ["Time deposits", "Currency in circulation", "Treasury bills", "Corporate bonds"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is included in M2, a broader measure of money supply compared to M1?",
      options: ["Currency in circulation", "Savings deposits", "Demand deposits", "Travelers checks"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is a factor income?",
      options: ["Profits", "Transfer payments", "Subsidies", "Indirect taxes"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is a common solution to the problem of common resources being overused?",
      options: ["Government regulation", "Privatization", "Subsidies", "Free-market competition"],
      correctIndex: 0  // a
    }
  ]
},
{
  id: "eco_rtp_may25",
  name: "RTP May 2025",
  type: "RTP",
  questions: [
    {
      text: "Fiscal federalism primarily deals with",
      options: ["Distribution of financial resources among different levels of government", "Distribution of power between Legislature and Executive", "Relationship between Judiciary and Legislature", "Conduct of elections in a federal country"],
      correctIndex: 0  // a
    },
    {
      text: "Under Article 112, the Annual Financial Statement is presented in which house of Parliament first?",
      options: ["Lok Sabha", "Rajya Sabha", "Joint Session of Parliament", "Finance Committee"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is NOT a function of NITI Aayog?",
      options: ["Policy formulation and coordination", "Allocation of financial resources to states", "Promoting cooperative federalism", "Serving as a think tank for the government"],
      correctIndex: 1  // b
    },
    {
      text: "The Government offer minimum assured price to the farmers to purchase their Output is called",
      options: ["Market Price", "Support Price", "Equilibrium Price", "Ceiling Price"],
      correctIndex: 1  // b
    },
    {
      text: "The Price in Collusive Oligopoly is decided by",
      options: ["The Firm", "Price leader", "The Industry", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "The Distinction between Selling Cost and Production cost was made by",
      options: ["Chamberlin", "Sweezy", "Mrs. Joan Robinson", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Which one of the following is not an internal economies of scale?",
      options: ["Technical economies", "Financial economies", "Economies due to localization of industries", "Marketing economies"],
      correctIndex: 2  // c
    },
    {
      text: "The share of the tax borne by seller will be larger",
      options: ["If the demand for the product is less elastic.", "If the demand for the product is inelastic.", "If the demand for the product has greater elasticity.", "If the elasticity of supply of the product is larger."],
      correctIndex: 2  // c
    },
    {
      text: "__ is concerned with welfare proposition.",
      options: ["Normative Economics", "Positive Economics", "Both a and b", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Excess capacity is not found under",
      options: ["Monopoly", "Monopolistic competition", "Perfect competition.", "Oligopoly"],
      correctIndex: 2  // c
    },
    {
      text: "Information Technology bubble burst of 2000 is an example of",
      options: ["Business Cycle", "Consumer Sovereignty", "Freedom of choice", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "What is the limitation of Consumer Surplus",
      options: ["Consumer surplus cannot be measured precisely", "The Consumer surplus derived from a commodity is affected by availability of substitute", "Both a & b", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Example of Third-Degree Price Discrimination",
      options: ["Dumping", "Charging different prices for domestic and commercial uses", "Lower prices in railways for senior citizen", "All of the above"],
      correctIndex: 3  // d
    },
    {
      text: "What activity is termed as activity of tertiary sector?",
      options: ["Wheat production", "Mobile production", "Construction of a dam", "Fishing"],
      correctIndex: 2  // c
    },
    {
      text: "FII helps to improve",
      options: ["Capital market", "How of equity capital", "Financial innovation and development", "All the above"],
      correctIndex: 3  // d
    },
    {
      text: "Devaluation of Indian Rupee in terms of US Dollar was in the year.",
      options: ["2019", "2000", "1981", "1991"],
      correctIndex: 3  // d
    },
    {
      text: "Which of the following statements is true about the Indian monetary system?",
      options: ["The Indian monetary system is based on the gold standard", "The Indian monetary system is based on the credit money standard", "The Indian monetary system is based on the paper standard", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following statements is true about the money supply?",
      options: ["It is the total volume of money that is held by the government of a country", "It is the total volume of money that is held by the general public of a country over a time period", "It is the total volume of money that is held by the general public of a country at a particular point in time", "All of the above"],
      correctIndex: 2  // c
    },
    {
      text: "Which of the following statements is true about credit creation by banks?",
      options: ["Banks create credit on the basis of their total assets", "Banks create credit on the basis of their total deposits", "Banks create credit on the basis of their total securities", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "The quantity demanded of money rises",
      options: ["As the interest rises", "As the interest falls", "As the supply of money falls", "As the number of banks rises"],
      correctIndex: 1  // b
    },
    {
      text: "Open market operation will become successful if there is a",
      options: ["a free-market economy", "developing economy", "well-developed bill and security market", "All of the above"],
      correctIndex: 2  // c
    },
    {
      text: "According to Keynes, inflationary gap is caused by",
      options: ["excess supply", "excess demand", "deficiency of demand", "deficiency of supply"],
      correctIndex: 1  // b
    },
    {
      text: "The effects of inflation on the price competitiveness of a country's products may be offset by",
      options: ["An appreciation of the currency", "A revaluation of the currency", "A depreciation of the currency", "None of the above"],
      correctIndex: 2  // c
    },
    {
      text: "What is Currency Deposit Ratio (CDR)?",
      options: ["Ratio of money held by the public in currency to that of money held in bank deposits", "Ratio of money held by the public in bank deposits to that of money held by public in currency", "Ratio of money held in demand drafts to that of money held in treasury bonds", "None of the above"],
      correctIndex: 0  // a
    },
    {
      text: "Find nominal GDP if real GDP 450 and price index 120",
      options: ["500", "450", "540", "None of these"],
      correctIndex: 2  // c
    }
  ]
},
{
  id: "eco_rtp_jan25",
  name: "RTP Jan 2025",
  type: "RTP",
  questions: [
    {
      text: "In explaining the level of unemployment, Keynes emphasized",
      options: ["Change in Technology", "Aggregate demand", "Inflationary expectations", "Lending by financial institutions"],
      correctIndex: 1  // b
    },
    {
      text: "When total demand for a commodity whose price has fallen increases it is due to",
      options: ["Price effect", "Income effect", "Substitution effect", "Complementary effect"],
      correctIndex: 0  // a
    },
    {
      text: "Envelope curve is also called",
      options: ["Long Run Average Cost curve", "Short Run Average Cost curve", "Average Fixed Cost", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Electricity Companies sells electricity at a cheaper rate in rural areas than for industrial use due to",
      options: ["Price Discrimination", "Perfect Competition", "Monopolistic Competition", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Coincident indicator is not indicated as",
      options: ["Inflation", "Industrial Production", "Retail Sales", "New order for plant and equipment"],
      correctIndex: 3  // d
    },
    {
      text: "The shape of the Cost curve depends upon",
      options: ["Cost function", "Factor of Production", "Outlay", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "In Oligopoly the firms may collude in order to",
      options: ["Increase Competition", "Prisoner dilemma for buyers", "To raise the price of the good they offer", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "How to Produce is related to",
      options: ["Products Choice", "Choice of technique", "Either a or b", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "Snob effect is explained as",
      options: ["It is a function of consumption of others", "It is a function of price", "Both a and b", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "To influence spending the monetary policy is directed at directly influencing in the short run",
      options: ["Interest Rate", "Unemployment", "Inflation Rate", "Growth Rate"],
      correctIndex: 0  // a
    },
    {
      text: "A firm normal profit earned are included in",
      options: ["Explicit Cost", "Implicit Cost", "Variable Cost", "Fixed Cost"],
      correctIndex: 2  // c
    },
    {
      text: "Isoquant in the relevant range are",
      options: ["Convex to the Origin", "Negatively Sloped", "Cannot cross", "All of the Above"],
      correctIndex: 3  // d
    },
    {
      text: "When Investment in an economy increases from 10000 crores to 14000 crores and as a result of this national income rises 80000 to 92000 crores, compute Investment Multiplier.",
      options: ["3", "4", "5", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is an example of market failure?",
      options: ["Externalities", "Low prices", "Excess supply", "Excludable and rival goods"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the following is included in M2, a broader measure of money supply compared to M1?",
      options: ["Currency in circulation", "Savings deposits", "Demand deposits", "Travelers checks"],
      correctIndex: 1  // b
    },
    {
      text: "Which of the following is an example of an automatic stabilizer in the budget?",
      options: ["Discretionary spending", "Progressive taxation", "Infrastructure investment", "Unemployment benefits"],
      correctIndex: 3  // d
    },
    {
      text: "FDI in telecom sector is raised to",
      options: ["49%", "51%", "100%", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "E-NAM is",
      options: ["An electronic name card given to citizens of India", "National Agriculture Market with the objective of creating a unified national market for agricultural commodities.", "a pan-India electronic trading portal which networks the existing APMC mandis", "b and c above"],
      correctIndex: 3  // d
    },
    {
      text: "The new economic policy of 1991 manifest in",
      options: ["State led industrialization and import substitution", "Rethinking the role of markets versus the state", "Emphasized the role of good governance", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "Dumping refers to",
      options: ["Reducing tariffs", "Sale of goods abroad at a lower price, below their cost and price in their home market", "Buying goods at low prices abroad and selling at higher prices locally", "None of these"],
      correctIndex: 1  // b
    },
    {
      text: "The WTO was established to implement the final act of Uruguay round agreement of",
      options: ["MFA", "GATT", "TRIP", "MNC"],
      correctIndex: 1  // b
    },
    {
      text: "__ are also known as International Bank for Reconstruction and Development.",
      options: ["IMF", "ADB", "World Bank", "ECM"],
      correctIndex: 2  // c
    },
    {
      text: "An important money market is instrument by the government to bridge the deficit between the revenue and expenditure in the budget.",
      options: ["T-bills", "Bonds", "CDs", "CPs"],
      correctIndex: 0  // a
    },
    {
      text: "Which of the statements gives a true picture of the effect of lowering the cash reserve ratio by the central bank of a country?",
      options: ["The lending capacity of commercial banks will increase", "The lending capacity of commercial banks will decrease", "The lending capacity of commercial banks may increase or decrease", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Which agency regulates the money supply in India?",
      options: ["The Government of India", "Commercial banks", "Reserve Bank of India", "None of the above"],
      correctIndex: 2  // c
    }
  ]
},
{
  id: "eco_rtp_sep24",
  name: "RTP Sep 2024",
  type: "RTP",
  questions: [
    {
      text: "The indifference curve of two substitute will be",
      options: ["Straight line", "U-Shaped", "C Shaped", "L shaped"],
      correctIndex: 0  // a
    },
    {
      text: "Which is not the External Causes of business cycle",
      options: ["Post War Reconstruction", "Technology Shocks", "Population Growth", "Money Supply"],
      correctIndex: 3  // d
    },
    {
      text: "Under which market form, the demand curve is steeper as compared to monopolistic competition?",
      options: ["Monopoly", "Oligopoly", "Perfect Competition", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "Marginal Product is the slope of",
      options: ["Marginal product Curve", "Average Product Curve", "Total Product Curve", "Implicit Product Curve"],
      correctIndex: 2  // c
    },
    {
      text: "The opportunity cost of a good is",
      options: ["The loss of interest in using savings", "The time lost in finding it.", "The quality of other goods sacrificed to get another unit of that good.", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "Under which market form price discrimination cannot persist",
      options: ["Oligopoly", "Monopolistic Competition", "Monopoly", "Perfect competition."],
      correctIndex: 3  // d
    },
    {
      text: "Certain Benefit an Industry gets when it expands its scale of production is Known as",
      options: ["Internal Economies", "Diseconomies", "External economies", "Profit"],
      correctIndex: 0  // a
    },
    {
      text: "Suppose we are drawing a supply curve of a farmer which of the following will be held constant",
      options: ["Price of Inputs", "Weather Conditions", "Technology", "The price of the Commodity under consideration"],
      correctIndex: 3  // d
    },
    {
      text: "The substitution effect will be stronger when",
      options: ["The goods are closer substitutes", "There is lower cost of switching to the substitute good", "There is lower inconvenience while switching to the substitute good.", "All of these"],
      correctIndex: 3  // d
    },
    {
      text: "Globalization indicate rapid ___ between countries",
      options: ["Competition", "Investment", "Integration", "None of these"],
      correctIndex: 2  // c
    },
    {
      text: "In order to influence spending on the goods and services in the short run, ___ is directed at directly influencing interest rate",
      options: ["Fiscal policy", "Budgetary policy", "Monetary policy", "Economic policy"],
      correctIndex: 2  // c
    },
    {
      text: "The law of consumer surplus is based on",
      options: ["Indifference curve analysis", "Revealed preference theory", "Law of substitution", "The law of diminishing marginal utility"],
      correctIndex: 3  // d
    },
    {
      text: "The four phases of the business cycle are",
      options: ["Peak, recession, trough and boom", "Peak, depression, trough and boom", "Peak, recession, trough and recovery", "Peak, depression, bust and boom."],
      correctIndex: 2  // c
    },
    {
      text: "Information Technology bubble burst of 2000 is an example of",
      options: ["Business Cycle", "Consumer Sovereignty", "Freedom of choice", "None of these"],
      correctIndex: 0  // a
    },
    {
      text: "The difference between gross domestic investment and net domestic investment is equal to",
      options: ["Unwanted inventory changes", "The difference between NDP and national income", "The difference between GDP and NDP", "None of the above"],
      correctIndex: 2  // c
    },
    {
      text: "Assume you deplete your savings to buy a new sofa and some government bonds and then take a vacation in a foreign country. Which of the following is true?",
      options: ["Consumption will increase", "Net exports will increase", "Government purchases will increase", "Investment will increase"],
      correctIndex: 0  // a
    },
    {
      text: "What is the similarity between the Subprime Crisis and Greece Crisis?",
      options: ["High Financial Leverage", "Low-Interest Rate", "Credit Expansion", "All of the above"],
      correctIndex: 3  // d
    },
    {
      text: "Among the following canons of taxation which one has been given by Adam Smith?",
      options: ["Canon of Uniformity", "Canon of productivity", "Canon of diversity", "Canon of equity"],
      correctIndex: 3  // d
    },
    {
      text: "The substitution effect works to encourage a consumer to purchase more of a product when the price of that product is falling because",
      options: ["The consumers real income has increased.", "The consumers real income has decreased.", "The product is now relatively less expensive than before.", "Other products are now less expensive than before."],
      correctIndex: 2  // c
    },
    {
      text: "If the market demand curve for a commodity has a negative slope, then the market structure must be",
      options: ["Perfect competition", "Monopoly", "Imperfect competition", "The market structure cannot be determined as the information is insufficient"],
      correctIndex: 3  // d
    },
    {
      text: "In economics, generally the classification of the markets is made on the basis of",
      options: ["Time", "Geographic area", "Volume of business", "All of these"],
      correctIndex: 3  // d
    },
    {
      text: "Which characteristic of money refers to its ability to hold value over time?",
      options: ["Divisibility", "Durability", "Portability", "Store of value"],
      correctIndex: 3  // d
    },
    {
      text: "Which of the following is included in M2, a broader measure of money supply compared to M1?",
      options: ["Currency in circulation", "Savings deposits", "Demand deposits", "Travelers checks"],
      correctIndex: 1  // b
    },
    {
      text: "What is the primary purpose of an import quota?",
      options: ["To encourage domestic production.", "To reduce government spending.", "To limit the quantity of imports.", "To increase the trade deficit."],
      correctIndex: 2  // c
    },
    {
      text: "Which exchange rate regime is adopted by highest no of IMF members",
      options: ["Hard Peg", "Floating", "Free Floating", "Soft Peg"],
      correctIndex: 3  // d
    }
  ]
}
    ]
  }
];