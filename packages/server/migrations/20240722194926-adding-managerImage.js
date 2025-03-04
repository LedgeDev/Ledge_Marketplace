module.exports = {
  async up(db, client) {
    // Agregar el campo managerImage a todos los documentos en la colección brands
    await db
      .collection('brands')
      .updateMany({}, { $set: { managerImage: '' } });
  },

  async down(db, client) {
    // Eliminar el campo managerImage de todos los documentos en la colección brands
    await db
      .collection('brands')
      .updateMany({}, { $unset: { managerImage: '' } });
  },
};
