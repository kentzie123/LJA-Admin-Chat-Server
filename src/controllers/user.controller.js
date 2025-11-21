// Response handler
import { success, error } from "../utils/responseHandlers.js";

// Services
import { updateUserById } from "../services/user.service.js";

// Image uploader
import { uploadImage } from "../utils/uploadImage.js";

export const updateUser = async (req, res) => {
  const userId = req.user.id;
  const updatedFields = req.body;

  if (updatedFields.profile_pic) {
    const uploadResult = await uploadImage(
      updatedFields.profile_pic,
      "profile-pictures"
    );
    if (!uploadResult.success) {
      return error(res, "Upload image failed", 400);
    }
    updateUserById(userId, {profile_pic: uploadResult.url});
    return success(res, uploadResult.url, 201);
  }


  if (!updatedFields.email || !updatedFields.fullname) {
    return error(res, "Profile info must not be empty", 400);
  }

  const { data, error: err } = await updateUserById(userId, updatedFields);

  if (err || data.length === 0) {
    return error(res, err.message);
  }

  const userInfo = data[0];

  return success(res, {
    id: userInfo.id,
    fullname: userInfo.fullname,
    email: userInfo.email,
    profile_pic: userInfo.profile_pic,
  });
};
