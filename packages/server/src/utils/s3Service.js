const axios = require('axios');

class S3Service {
  async getSignedUrl(extension) {
    const response = await axios.get("/s3url/" + extension);
    return response;
  }

  async getSignedUpdateUrl(fileNameWithExt) {
    const response = await axios.get("/s3url/update/" + fileNameWithExt);
    return response;
  }
}

module.exports = new S3Service();
