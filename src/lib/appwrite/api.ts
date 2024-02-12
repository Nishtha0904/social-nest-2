import { INewUser, INewPost,IUpdatePost, IUpdateUser } from "@/types";
import { ID ,Query} from "appwrite";
import { account, avatars , databases, appwriteConfig,storage} from "./config";
export async function createUserAccount(user: INewUser) {
    try {
      const newAccount = await account.create(
        ID.unique(),
        user.email,
        user.password,
        user.name
      );
  
      if (!newAccount) throw Error;
  
      const avatarUrl = avatars.getInitials(user.name);
  
      const newUser = await saveUserToDB({
        accountId: newAccount.$id,
        name: newAccount.name,
        email: newAccount.email,
        username: user.username,
        imageUrl: avatarUrl,
      });
  
      return newUser;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  
  // ============================== SAVE USER TO DB
  export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    imageUrl: URL;
    username?: string;
  }) {
    try {
      const newUser = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        user
      );
  
      return newUser;
    } catch (error) {
      console.log(error);
    }
  }
  
  // ============================== SIGN IN
  export async function signInAccount(user: { email: string; password: string }) {
    try {
      const session = await account.createEmailSession(user.email, user.password);
  
      return session;
    } catch (error) {
      console.log(error);
    }
  }
  
  // ============================== GET ACCOUNT
  export async function getAccount() {
    try {
      const currentAccount = await account.get();
  
      return currentAccount;
    } catch (error) {
      console.log(error);
    }
  }
  
  // ============================== GET USER
  export async function getCurrentUser() {
    try {
      const currentAccount = await getAccount();
  
      if (!currentAccount) throw Error;
  
      const currentUser = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("accountId", currentAccount.$id)]
      );
  
      if (!currentUser) throw Error;
  
      return currentUser.documents[0];
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  export async function signOutAccount() {
    try {
      const session = await account.deleteSession("current");
      console.log(session);
      return session;
    } catch (error) {
      console.log(error);
    }
  }


  export async function createPost(post: INewPost) {
    try {
        // Upload image to storage
        const uploadedFile = await upLoadFile(post.file[0]);
        if (!uploadedFile) throw Error;
        
        // get file url
        const fileUrl = getFilePreview(uploadedFile.$id)
        if (!fileUrl) {
            deleteFile(uploadedFile.$id)
            throw Error
        }
        // convert tags into an array
        const tags = post?.tags?.replace(/ /g, "").split(",") || []
        // create post 
        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(), {
            creator: post.userId,
            caption: post.caption,
            imageUrl: fileUrl,
            imageId: uploadedFile.$id,
            location: post.location,
            tags: tags
        })

        console.log(newPost, "newPost")

        if (!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error
        }
        return newPost
    } catch (error) {
        console.error("Failed while creating the Post", error)
    }
}

export async function upLoadFile(file: File) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        );
        return uploadedFile;
    } catch (error) {
        console.log("Failed while uploading a file to server", error)
    }
}


export function getFilePreview(fileId: string) {
    try {
        const fileUrl = storage.getFilePreview(appwriteConfig.storageId, fileId, 2000, 2000, 'top', 100)
        if (!fileUrl) throw Error
        return fileUrl
    } catch (error) {
        console.error("Failed while taking the Post Preview", error)
    }
}

export async function deleteFile(fileId: string) {
    try {
        await storage.deleteFile(appwriteConfig.storageId, fileId);
        return { status: "ok" }

    } catch (error) {
        console.error("Failed while deleting the file", error)
    }
}


export async function updatePost(post: IUpdatePost) {
  //edit the details of particular post in postForm
  const hasFiletoUpdate = post.file.length > 0;
  console.log(post.file.length, post, "length")
  try {
      let image = {
          imageUrl: post.imageUrl,
          imageId: post.imageId,
      }

      if (hasFiletoUpdate) {
          const uploadedFile = await upLoadFile(post.file[0]);
          if (!uploadedFile) throw Error;
          // get file url
          const fileUrl = getFilePreview(uploadedFile.$id)
          if (!fileUrl) {
              deleteFile(uploadedFile.$id)
              throw Error
          }
          image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
      }

      // convert tags into an array
      const tags = post?.tags?.replace(/ /g, "").split(",") || []
      // create post 
      const updatedPost = await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          post.postId, {
          caption: post.caption,
          imageUrl: image.imageUrl,
          imageId: image.imageId,
          location: post.location,
          tags: tags
      })

      console.log(updatedPost, "newPost")

      if (!updatedPost) {
          await deleteFile(post.imageId)
          throw Error
      }

      return updatedPost;
  } catch (error) {
      console.error("Failed while creating the Post", error)
  }
}



export async function getRecentPosts() {
  try {
      const posts = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.orderDesc("$createdAt"), Query.limit(20)]
      )
      if (!posts) throw Error

      return posts
  } catch (error) {
      console.log(error);

  }
}


// ============================== LIKE / UNLIKE POST
export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray,
      }
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}



// ============================== SAVE POST
export async function savePost(userId: string, postId: string) {
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId,
      }
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}



export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId
    );

    if (!statusCode) throw Error;

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POST BY ID
export async function getPostById(postId?: string) {
  if (!postId) throw Error;

  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}



// ============================== DELETE POST
export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}


export async function getUserPosts(userId?: string) {
  if (!userId) return;

  try {
      const post = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
      );

      if (!post) throw Error;

      return post;
  } catch (error) {
      console.log(error);
  }
}


export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(10)]

  if (pageParam) {
      queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
      const posts = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          queries
      )

      if (!posts) throw Error

      return posts;
  } catch (error) {
      console.error("Error while getting infinite posts : ", error)
  }
}

export async function searchPosts(searchTerm: string) {
  try {
      const posts = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.search("caption", searchTerm)]
      )

      if (!posts) throw Error

      return posts;
  } catch (error) {
      console.error("Error while getting searching the post", error)
  }
}


export async function getUsers(limit?: number) {
  const queries: any[] = [Query.orderDesc("$createdAt")];

  if (limit) {
      queries.push(Query.limit(limit));
  }

  try {
      const users = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.userCollectionId,
          queries
      );

      if (!users) throw Error;

      return users;
  } catch (error) {
      console.log(error);
  }
}
export async function getUserById(userId: string) {
  try {
      const user = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userCollectionId,
          userId
      );

      if (!user) throw Error;

      return user;
  } catch (error) {
      console.log(error);
  }
}


export async function updateUser(user: IUpdateUser) {
  const hasFileToUpdate = user.file.length > 0;
  try {
      let image = {
          imageUrl: user.imageUrl,
          imageId: user.imageId,
      };

      if (hasFileToUpdate) {
          // Upload new file to appwrite storage
          const uploadedFile = await upLoadFile(user.file[0]);
          if (!uploadedFile) throw Error;

          // Get new file url
          const fileUrl = getFilePreview(uploadedFile.$id);
          if (!fileUrl) {
              await deleteFile(uploadedFile.$id);
              throw Error;
          }

          image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
      }

      //  Update user
      const updatedUser = await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userCollectionId,
          user.userId,
          {
              name: user.name,
              bio: user.bio,
              imageUrl: image.imageUrl,
              imageId: image.imageId,
          }
      );

      // Failed to update
      if (!updatedUser) {
          // Delete new file that has been recently uploaded
          if (hasFileToUpdate) {
              await deleteFile(image.imageId);
          }
          // If no new file uploaded, just throw error
          throw Error;
      }

      // Safely delete old file after successful update
      if (user.imageId && hasFileToUpdate) {
          await deleteFile(user.imageId);
      }

      return updatedUser;
  } catch (error) {
      console.log(error);
  }
}