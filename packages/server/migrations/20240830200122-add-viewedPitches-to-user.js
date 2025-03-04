module.exports = {
  async up(db, client) {
    // Agrega el campo viewedPitches como un arreglo de strings a todos los usuarios
    await db.collection('users').updateMany({}, {
      $set: { viewedPitches: [] }
    });
  },

  async down(db, client) {
    // Elimina el campo viewedPitches de todos los usuarios
    await db.collection('users').updateMany({}, {
      $unset: { viewedPitches: "" }
    });
  }
};
