module.exports = {
  async up(db, client) {
    const dealCodeGroupsCollection = db.collection("deal-code-groups");
    const adventCalendarBrandsCollection = db.collection("advent-calendar-brands");

    // Fetch all elements with "adventCalendarEvent" as a boolean
    const cursor = dealCodeGroupsCollection.find({ adventCalendarEvent: { $type: "bool" } });
    while (await cursor.hasNext()) {
      const dealCodeGroup = await cursor.next();

      // Check if adventCalendarEvent is false
      if (!dealCodeGroup.adventCalendarEvent) {
        // Remove adventCalendarEvent attribute
        await dealCodeGroupsCollection.updateOne(
          { _id: dealCodeGroup._id },
          { $unset: { adventCalendarEvent: "" } }
        );
        continue;
      }

      // Fetch the corresponding advent-calendar-brands document
      const adventCalendarBrand = await adventCalendarBrandsCollection.findOne({ brandId: dealCodeGroup.brandId });

      if (adventCalendarBrand && adventCalendarBrand.day) {
        // Transform the adventCalendarEvent attribute
        await dealCodeGroupsCollection.updateOne(
          { _id: dealCodeGroup._id },
          { $set: { adventCalendarEvent: { day: adventCalendarBrand.day } } }
        );
      }
    }
  },

  async down(db, client) {
    const dealCodeGroupsCollection = db.collection("deal-code-groups");

    // Revert "adventCalendarEvent" to boolean if it was previously transformed
    const cursor = dealCodeGroupsCollection.find({
      $or: [
        { "adventCalendarEvent.day": { $exists: true } },
        { adventCalendarEvent: { $exists: false } }
      ]
    });
    while (await cursor.hasNext()) {
      const dealCodeGroup = await cursor.next();

      // Revert to boolean true for objects previously transformed to { day: <value> }
      // Re-add the boolean false for attributes removed in the up migration
      const newAdventCalendarEventValue = dealCodeGroup.adventCalendarEvent && dealCodeGroup.adventCalendarEvent.day ? true : false;

      await dealCodeGroupsCollection.updateOne(
        { _id: dealCodeGroup._id },
        { $set: { adventCalendarEvent: newAdventCalendarEventValue } }
      );
    }
  }
};
