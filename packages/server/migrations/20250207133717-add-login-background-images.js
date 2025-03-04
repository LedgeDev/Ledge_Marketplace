const imageUrls = [
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX4TODS5OP6RZBDIBGICWVJQV44D",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=webp&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KXY5NZRULO6UDRDLAEJC5P54QEFH",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=webp&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX5BI6IPORKPHJFLAU5B6EXSCAOL",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX3QIGT35W4YGFGLKER4EMYX3APO",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX4LAN5UFYSGCJD3B3N7FBDCKOG7",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX57QNSLVHVUENG2JQPVZ7ML3RSB",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX4UM6XUS5L7URD3TCDITYYQVGES",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX3237LRRZ3MJNELUHJJUIDEFADU",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=webp&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX4LBXUXX5T5KZC3FR5AYL7G3XGJ",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=webp&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX6VRINXW6ZEOFH26X72DMWCPZV7",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=webp&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX7UCRYAPOIY2NAYM6JXPJN74G74",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KXYM5SK2ZQQSKRHJUSFGD2GLZY43",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KXYBEIRIO4KODVB2YNSJLYBE2E63",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KXYPJ5HI7M54O5FYORGFHJ46HFQS",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KX5KLAUYYAYX5FDJPDKEWT2Z5QYJ",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpeg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KXYPOEUEQGBQ2VF2HRNXKCEKX2U2",
  "https://ukwest1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=188929&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!zBROw4MAEEGFlUsc5R9M_4qoq4dStGVJqh7gnFhKTxiodw019V66RL4uxjw8Kdsn%2Fitems%2F01P4B2KXZ6A7TUXVIQ4VHYVRXKUMJEQD7A"
];

module.exports = {
  async up(db) {
    const collection = db.collection('login-background-images');
    const now = new Date();

    const images = imageUrls.map(url => ({
      imageUrl: url,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }));

    const result = await collection.insertMany(images);
    console.log(`Added ${result.insertedCount} background images`);
  },

  async down(db) {
    const collection = db.collection('login-background-images');
    const result = await collection.deleteMany({
      imageUrl: { $in: imageUrls }
    });
    console.log(`Removed ${result.deletedCount} background images`);
  }
};
