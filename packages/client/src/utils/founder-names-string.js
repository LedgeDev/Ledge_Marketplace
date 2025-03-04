const getFounderNamesString = (brandFounderNames) => {
  const founders = brandFounderNames.map(name => name.trim()).filter(name => name !== '');
  // Put the names of the founders in a string,
  // separated by commas and an '&' before the last name
  if (founders.length === 1) {
    return founders[0];
  }
  let names = "";
  for (let i = 0; i < founders.length; i++) {
    if (i === founders.length - 1) {
      names += `& ${founders[i]}`;
    } else {
      names += `${founders[i]}, `;
    }
  }
  return names;
};

export default getFounderNamesString;