import mongoose, { Schema, Document } from 'mongoose';

export interface ImageType {
  url: string;
}

export interface ReplyType extends Document {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePic: string;
  };
  content: string;
  createdAt: Date;
}

export interface CommentType extends Document {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePic: string;
  };
  content: string;
  replies: ReplyType[];
  createdAt: Date;
}

export interface PostType extends Document {
  user: string;
  content: string;
  images: ImageType[];
  createdAt: Date;
  comments: CommentType[];
  likes: {
    user: string;
  }[];
}

const replySchema = new mongoose.Schema({
  user: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      required: true,
    },
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const commentSchema = new mongoose.Schema({
  user: {
    type: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      profilePic: {
        type: String,
        required: true,
      },
    },
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
});

const postSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  images: {
    type: [imageSchema],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  comments: [commentSchema],
  likes: [
    {
      user: {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        firstName: {
          type: String,
          required: true,
        },
        lastName: {
          type: String,
          required: true,
        },
        profilePic: {
          type: String,
          required: true,
        },
      },
    },
  ],
  viewCount: {
    type: Number,
    default: 0,
  },
});



mongoose.model<PostType>('Post', postSchema);
