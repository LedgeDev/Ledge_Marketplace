module.exports = {
  async up(db, client) {
    // Eliminar los parámetros chatLink y phrases de todas las brands
    await db.collection('brands').updateMany({}, {
      $unset: {
        chatLink: "",
        phrases: ""
      }
    });
  },

  async down(db, client) {
    // No podemos revertir la eliminación completa sin los valores originales
    // pero dejamos este bloque vacío ya que no hay una manera precisa de revertir sin datos originales
  }
};
