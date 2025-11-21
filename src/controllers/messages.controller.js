// Services
import {
  addMessage,
  getMessagesFromTo,
  getMoreOlderMesssage,
} from "../services/message.service.js";

// Response handler
import { success, error } from "../utils/responseHandlers.js";

// Utils
import { uploadImage } from "../utils/uploadImage.js";

import { io, userSocketMap } from "../server.js";

// Supabase
import supabase from "../config/db.js";

// Send message client
export const clientMessageSender = async (req, res) => {
  const { text, attachments } = req.body;
  const receiver_id = process.env.CHAT_ADMIN_ID;
  const sender_id = req.params.clientId;
  

  let uploadedAttachments = [];

  // Handle file uploads to Supabase Storage
  if (attachments && attachments.length > 0) {
    try {
      for (const attachment of attachments) {
        const fileUrl = await uploadFileToSupabase(attachment);
        if (fileUrl) {
          uploadedAttachments.push({
            url: fileUrl,
            name: attachment.name,
            type: attachment.type,
            isImage: attachment.isImage,
            size: attachment.size,
          });
        }
      }
    } catch (err) {
      console.error("File upload error:", err);
      return error(res, "Failed to upload files", 500);
    }
  }

  // Store message with attachment URLs
  const { data, error: err } = await addMessage({
    text,
    attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null,
    sender_id,
    receiver_id,
  });
  

  if (err || data.length === 0) {
    return error(res, err);
  }

  console.log("Selected user:", receiver_id);
  console.log(
    `Sending and emitting message to ${userSocketMap[receiver_id]}`,
    data[0]
  );

  io.to(userSocketMap[receiver_id]).emit("new_message", data[0]);

  return success(res, data[0], 201);
};

// Helper function to upload files to Supabase Storage
const uploadFileToSupabase = async (attachment) => {
  try {
    // Extract base64 data
    const base64Data = attachment.data.split(",")[1]; // Remove data:image/... prefix
    const buffer = Buffer.from(base64Data, "base64");

    const fileExt = attachment.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;

    // Organize by file type
    const folder = attachment.isImage ? "message-images" : "message-documents";
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("message-attachments")
      .upload(filePath, buffer, {
        contentType: attachment.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("message-attachments").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Supabase upload error:", error);
    throw error;
  }
};

// Send message
export const sendMessage = async (req, res) => {
  const { text, attachments } = req.body; // Changed from 'attachment' to 'attachments'
  const { id: receiver_id } = req.params;
  const sender_id = req.user.id;

  let uploadedAttachments = [];

  // Handle multiple file uploads to Supabase Storage
  if (attachments && attachments.length > 0) {
    try {
      for (const attachment of attachments) {
        const fileUrl = await uploadFileToSupabase(attachment);
        if (fileUrl) {
          uploadedAttachments.push({
            url: fileUrl,
            name: attachment.name,
            type: attachment.type,
            isImage: attachment.isImage,
            size: attachment.size
          });
        }
      }
      console.log(`Uploaded ${uploadedAttachments.length} files successfully`);
    } catch (error) {
      console.error('File upload error:', error);
      return error(res, "Failed to upload files", 500);
    }
  }

  // Store message with attachment URLs
  const { data, error: err } = await addMessage({
    text,
    attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null, // Store as JSON array
    sender_id,
    receiver_id,
  });

  if (err || data.length === 0) {
    console.log("Database error:", err);
    return error(res, "Failed to send message. Server error");
  }

  console.log("Selected user:", receiver_id);
  console.log(`Sending and emitting message to ${userSocketMap[receiver_id]}`, data[0]);

  io.to(userSocketMap[receiver_id]).emit("new_message", data[0]);

  return success(res, data[0], 201);
};



// Get messages by senderid and receiverid
export const getMessages = async (req, res) => {
  const receiver_id = process.env.CHAT_ADMIN_ID;
  const sender_id = req.params.senderId;

  if (!receiver_id) {
    return error(res, "Receiver ID required", 400);
  }
  if (!sender_id) {
    return error(res, "Sender ID required", 400);
  }

  const { data, error: err } = await getMessagesFromTo(sender_id, receiver_id);

  if (err) {
    return error(res, err.message, 400);
  } else {
    return success(res, data);
  }
};

export const loadMoreMessages = async (req, res) => {
  const { receiver_id, oldestDate, limit } = req.query;
  const sender_id = req.user.id;
  const fixedDateString = oldestDate.replace(" ", "+"); // replace space with + for valid format on toISOString()
  const oldestDateToISOFormat = new Date(fixedDateString).toISOString();

  if (!receiver_id) {
    return error(res, "Receiver ID required", 400);
  }

  if (!sender_id) {
    return error(res, "Sender ID required", 400);
  }

  if (!oldestDate) {
    return error(res, "Oldest Date required", 400);
  }

  const { data, error: err } = await getMoreOlderMesssage(
    sender_id,
    receiver_id,
    oldestDateToISOFormat,
    limit
  );

  if (err) {
    console.log(err);

    return error(res, err.message, 400);
  } else {
    return success(res, data);
  }
};
