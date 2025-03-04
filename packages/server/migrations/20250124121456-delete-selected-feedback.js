module.exports = {
  async up(db, client) {
    try {
      // Get all brands
      const brands = await db.collection('brands').find().toArray();

      for (const brand of brands) {
        if (!brand.usersFeedback || !Array.isArray(brand.usersFeedback)) {
          continue;
        }

        // Create a new usersFeedback array with index values from selectedFeedback
        const updatedUsersFeedback = brand.usersFeedback.map(feedback => {
          // Remove the 'show' attribute
          const { show, ...feedbackWithoutShow } = feedback;

          // Find matching selectedFeedback by text and name
          const selectedFeedback = brand.selectedFeedback?.find(
            selected => selected.text === feedback.text && selected.name === feedback.name
          );

          // Add the index from selectedFeedback or null if not found
          return {
            ...feedbackWithoutShow,
            index: selectedFeedback?.index ?? null
          };
        });

        // Update the brand document
        await db.collection('brands').updateOne(
          { _id: brand._id },
          {
            $set: { usersFeedback: updatedUsersFeedback },
            $unset: { selectedFeedback: "" }
          }
        );
      }

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      // Get all brands
      const brands = await db.collection('brands').find().toArray();

      for (const brand of brands) {
        if (!brand.usersFeedback || !Array.isArray(brand.usersFeedback)) {
          continue;
        }

        // Recreate the selectedFeedback array from usersFeedback with index
        const selectedFeedback = brand.usersFeedback
          .filter(feedback => feedback.index !== null)
          .map(feedback => ({
            text: feedback.text,
            name: feedback.name,
            index: feedback.index
          }))
          .sort((a, b) => a.index - b.index);

        // Add back the 'show' attribute to usersFeedback
        const updatedUsersFeedback = brand.usersFeedback.map(feedback => ({
          ...feedback,
          show: false,
          index: null
        }));

        // Update the brand document
        await db.collection('brands').updateOne(
          { _id: brand._id },
          {
            $set: {
              usersFeedback: updatedUsersFeedback,
              selectedFeedback: selectedFeedback
            }
          }
        );
      }

      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Error in rollback:', error);
      throw error;
    }
  }
};
