import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IParticipant {
  userId: string;
  role: 'customer' | 'vendor' | 'provider';
  name: string;
}

export interface IEmbeddedMessage {
  _id: mongoose.Types.ObjectId;
  senderId: string;
  senderRole: 'customer' | 'vendor' | 'provider';
  senderName: string;
  content: string;
  createdAt: Date;
}

export interface IConversation extends Document {
  participants: IParticipant[];
  messages: IEmbeddedMessage[];
  lastMessage: string;
  lastMessageAt: Date;
  unreadFor: string[];
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    userId: { type: String, required: true },
    role:   { type: String, enum: ['customer', 'vendor', 'provider'], required: true },
    name:   { type: String, required: true },
  },
  { _id: false },
);

const EmbeddedMessageSchema = new Schema<IEmbeddedMessage>(
  {
    senderId:   { type: String, required: true },
    senderRole: { type: String, enum: ['customer', 'vendor', 'provider'], required: true },
    senderName: { type: String, required: true },
    content:    { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt:  { type: Date, default: Date.now },
  },
  { _id: true },
);

const ConversationSchema = new Schema<IConversation>(
  {
    participants:  { type: [ParticipantSchema], required: true },
    messages:      { type: [EmbeddedMessageSchema], default: [] },
    lastMessage:   { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadFor:     { type: [String], default: [] },
  },
  { timestamps: true },
);

ConversationSchema.index({ 'participants.userId': 1 });

if (mongoose.models.Conversation) {
  Reflect.deleteProperty(mongoose.models, 'Conversation');
}

const Conversation: Model<IConversation> = mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;
