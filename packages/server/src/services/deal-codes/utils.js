const prisma = require('../../prisma');
const csv = require('csv-parser');
const stream = require('stream');

async function uploadCsvCodes(file, brandId, description, shortDescription, expirationDate, startXCoordinate = 0, startYCoordinate = 0, numberOfCodes = null) {
  return new Promise((resolve, reject) => {
    const results = [];
    let skkiped_rows = 0;

    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    bufferStream
      .pipe(csv({
        separator: ';',
        trim: true
      }))
      .on('data', (data) => {

        if (skkiped_rows < startYCoordinate) {
          skkiped_rows++;
          return;
        }

        if (numberOfCodes && results.length >= numberOfCodes) {
          bufferStream.destroy();
          return;
        }

        // Data is a json. Convert to list, ignoring the keys
        const code = Object.values(data)[startXCoordinate];

        if (code) {
          results.push(code);
        }

      })
      .on('end', async () => {
        try {

          // Create a new deal code group
          const groupData = {
            description,
            brandId,
            generalExpireDate: expirationDate ? new Date(expirationDate) : null,
            codesState: 'shopifyCvsCodes',
          };

          if (shortDescription) {
            groupData.shortDescription = shortDescription;
          }

          const newGroup = await prisma.deal_code_groups.create({ data: groupData });

          const dealCodes = results.map(code => ({
            code,
            groupId: newGroup.id,
            userId: null,
          }));

          if (dealCodes.length === 0) {
            reject(new Error('No valid deal codes found in the CSV'));
            return;
          }

          await prisma.deal_codes.createMany({
            data: dealCodes
          });

          resolve({
            message: `${dealCodes.length} deal codes uploaded successfully`,
            groupId: newGroup.id
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function uploadGeneralCodes(codePattern, numberOfCodes, brandId, description, shortDescription, expirationDate) {
  try {
    // Validate code pattern length if it's not empty
    if (codePattern !== "" && codePattern.length < 6) {
      throw new Error('Code pattern must be at least 6 characters long');
    }

    // Create a new deal code group
    const groupData = {
      description,
      brandId,
      generalExpireDate: expirationDate ? new Date(expirationDate) : null,
      // Set codesState based on whether codePattern is empty or not
      codesState: codePattern ? 'generalCodes' : 'emptyCodes'
    };

    if (shortDescription) {
      groupData.shortDescription = shortDescription;
    }

    const newGroup = await prisma.deal_code_groups.create({ data: groupData });

    // Create specified number of codes with the same pattern
    const dealCodes = Array.from({ length: numberOfCodes }, () => ({
      code: codePattern,
      groupId: newGroup.id,
      userId: null,
    }));

    await prisma.deal_codes.createMany({
      data: dealCodes
    });

    return {
      message: `${dealCodes.length} deal codes generated and uploaded successfully`,
      groupId: newGroup.id
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  uploadCsvCodes,
  uploadGeneralCodes
};
