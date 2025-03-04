module.exports = {
  async up(db, client) {
    // Get all question classes
    const questionClasses = await db.collection('question-classes').find({}).toArray();
    
    // Check each question class
    for (const questionClass of questionClasses) {
      // Count questions that reference this class
      const questionCount = await db.collection('questions').countDocuments({
        classId: questionClass._id
      });
      
      // If no questions reference this class, delete it
      if (questionCount === 0) {
        await db.collection('question-classes').deleteOne({
          _id: questionClass._id
        });
      }
    }
  },

  async down(db, client) {
    // Note: This migration cannot be rolled back accurately since we don't store
    // the deleted question classes. The best we can do is document this limitation.
    console.log('Warning: This migration cannot be rolled back as the deleted question classes were not stored.');
  }
};