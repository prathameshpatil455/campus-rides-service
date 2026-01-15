import dotenv from "dotenv";
import connectDB from "../src/config/database.js";
import User from "../src/models/User.js";
import Ride from "../src/models/Ride.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";

dotenv.config();
// npm run seed:conversation 695c96af52568f46aa59b2e6 695cf28671f764eb61233ca9
const getUserIdsFromArgs = () => {
  const args = process.argv.slice(2);
  return args.filter((arg) => arg && !arg.startsWith("-"));
};

const seedTestConversation = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    const userIds = getUserIdsFromArgs();
    const userId1 = userIds[0];
    const userId2 = userIds[1];

    if (!userId1) {
      console.error("❌ Please provide at least one user ID as an argument");
      console.error(
        "Usage: node scripts/seedTestConversation.js <userId1> [userId2]"
      );
      process.exit(1);
    }

    const user1 = await User.findById(userId1);
    if (!user1) {
      console.error(`❌ User with ID ${userId1} not found`);
      process.exit(1);
    }

    console.log(
      `✅ Found user 1: ${user1.email} (${user1.firstName} ${user1.lastName})`
    );

    let user2;
    if (userId2) {
      if (userId1 === userId2) {
        console.error(
          `❌ Cannot create conversation: both user IDs are the same`
        );
        process.exit(1);
      }
      user2 = await User.findById(userId2);
      if (!user2) {
        console.error(`❌ User with ID ${userId2} not found`);
        process.exit(1);
      }
      console.log(
        `✅ Found user 2: ${user2.email} (${user2.firstName} ${user2.lastName})`
      );
    } else {
      console.log("📝 Creating a dummy user for testing...");
      user2 = await User.create({
        firstName: "Test",
        lastName: "User",
        email: `testuser${Date.now()}@rvce.edu.in`,
        studentIdNumber: `TEST${Date.now()}`,
        department: "CSE",
        year: "3",
        password: "test123456",
        roles: ["passenger"],
        isEmailVerified: true,
      });
      console.log(`✅ Created dummy user: ${user2.email}`);
    }

    const driverId = user1.roles?.includes("driver") ? user1._id : user2._id;
    const passengerId =
      driverId.toString() === user1._id.toString() ? user2._id : user1._id;

    let testRide = await Ride.findOne({
      driverId,
      status: { $in: ["active", "completed"] },
    }).sort({ createdAt: -1 });

    if (!testRide) {
      console.log("📝 Creating a ride for testing...");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      testRide = await Ride.create({
        driverId,
        pickup: "Main Gate",
        destination: "Engineering Block",
        time: futureDate,
        availableSeats: 3,
        price: 50,
        status: "active",
      });
      console.log(
        `✅ Created ride: ${testRide.pickup} → ${testRide.destination}`
      );
    } else {
      console.log(
        `✅ Using existing ride: ${testRide.pickup} → ${testRide.destination}`
      );
    }

    let conversation = await Conversation.findOne({
      rideId: testRide._id,
      driverId,
      passengerId,
    });

    if (!conversation) {
      console.log("📝 Creating conversation between the two users...");
      conversation = await Conversation.create({
        rideId: testRide._id,
        driverId,
        passengerId,
        participants: [driverId, passengerId],
        isActive: true,
      });
      console.log(`✅ Created conversation: ${conversation._id}`);
    } else {
      conversation.isActive = true;
      await conversation.save();
      console.log(`✅ Using existing conversation: ${conversation._id}`);
    }

    const existingMessages = await Message.countDocuments({
      conversationId: conversation._id,
    });

    if (existingMessages === 0) {
      console.log("📝 Adding dummy messages...");
      const messages = [
        {
          conversationId: conversation._id,
          senderId: user2._id,
          content: "Hi! Thanks for the ride yesterday. It was great!",
        },
        {
          conversationId: conversation._id,
          senderId: user1._id,
          content:
            "You're welcome! Happy to help. Let me know if you need a ride again.",
        },
        {
          conversationId: conversation._id,
          senderId: user2._id,
          content:
            "Sure! I'll definitely reach out if I need another ride. Thanks again!",
        },
      ];

      const createdMessages = await Message.insertMany(messages);
      console.log(`✅ Created ${createdMessages.length} dummy messages`);

      const lastMessage = createdMessages[createdMessages.length - 1];
      conversation.lastMessage = lastMessage.content;
      conversation.lastMessageTime = lastMessage.createdAt;
      await conversation.save();
    } else {
      console.log(`ℹ️  Conversation already has ${existingMessages} messages`);
    }

    console.log("\n✅ Test data seeded successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Conversation ID: ${conversation._id}`);
    console.log(
      `   - User 1: ${user1.email} (${user1.firstName} ${user1.lastName})`
    );
    console.log(
      `   - User 2: ${user2.email} (${user2.firstName} ${user2.lastName})`
    );
    console.log(
      `   - Driver: ${
        driverId.toString() === user1._id.toString() ? user1.email : user2.email
      }`
    );
    console.log(
      `   - Passenger: ${
        passengerId.toString() === user1._id.toString()
          ? user1.email
          : user2.email
      }`
    );
    console.log(`   - Ride: ${testRide.pickup} → ${testRide.destination}`);
    console.log(
      `\n💡 You can now test WebSocket by sending messages to conversation: ${conversation._id}`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    process.exit(1);
  }
};

seedTestConversation();
