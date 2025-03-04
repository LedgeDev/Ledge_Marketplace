module.exports = {
  async up(db, client) {
    // Agregar el atributo selectedFeedback como un arreglo vacío a todas las brands
    await db.collection('brands').updateMany({}, { $set: { selectedFeedback: [] } });
  },

  async down(db, client) {
    // Eliminar el atributo selectedFeedback de todas las brands
    await db.collection('brands').updateMany({}, { $unset: { selectedFeedback: "" } });
  }
};
