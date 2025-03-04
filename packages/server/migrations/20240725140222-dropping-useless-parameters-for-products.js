module.exports = {
  async up(db, client) {
    // Eliminar los campos userTarget, descriptionBullets, materials y climateFootprint de todos los productos
    await db.collection('products').updateMany({}, {
      $unset: {
        userTarget: "",
        descriptionBullets: "",
        materials: "",
        climateFootprint: "",
        superDealPrice: "",
        superDeal: "",

      }
    });
  },

  async down(db, client) {
    // No podemos revertir la eliminación completa sin los valores originales
    // pero dejamos este bloque vacío ya que no hay una manera precisa de revertir sin datos originales
  }
};
