import {
    useDeleteSavedPost,
    useGetCurrentUser,
    useLikePost,
    useSavePost,
  } from "@/lib/react-query/queriesAndMutations";
  import { checkIsLiked, imageNameWithUrl } from "@/types/utils";
  import { Models } from "appwrite";
  import React, { useEffect, useState } from "react";
  import Loader from "./Loader";
  type PostStatsProps = {
    post?: Models.Document;
    userId: string;
  };
  
  const PostStats = ({ post, userId }: PostStatsProps) => {
    const likesList = post?.likes.map((user: Models.Document) => user.$id);
    const [likes, setLikes] = useState<string[]>(likesList);
    const [saved, setIsSaved] = useState(false);
  
    const { mutate: likePost } = useLikePost();
    const { mutate: savePost, isPending: isSavingPost } = useSavePost();
    const { mutate: deleteSavedPost, isPending: isDeletingSaved } =
      useDeleteSavedPost();
  
    const { data: currentUser } = useGetCurrentUser();
  
    const savePostRecord = currentUser?.save.find(
      (record: Models.Document) => record.post.$id === post?.$id
    );
  
    useEffect(() => {
      setIsSaved(!!savePostRecord);
    }, [currentUser]);
  
    const handleLikePost = (e: React.MouseEvent) => {
      // stopProgration with stop to navigate to another page or we can say it stops to apply action anywhere else except like in our case
      e.stopPropagation();
      let newLikes = [...likes];
  
      const hasLiked = newLikes.includes(userId);
  
      if (hasLiked) {
        newLikes = newLikes.filter((id) => id !== userId);
      } else {
        newLikes.push(userId);
      }
  
      setLikes(newLikes);
      likePost({ postId: post?.$id || "", likesArray: newLikes });
    };
  
    const handleSavePost = (
      e: React.MouseEvent<HTMLImageElement, MouseEvent>
    ) => {
      e.stopPropagation();
  
      if (savePostRecord) {
        setIsSaved(false);
        return deleteSavedPost(savePostRecord.$id);
      }
      console.log({ postId: post?.$id || "", userId: userId }, "check data");
      savePost({ postId: post?.$id || "", userId: userId });
      setIsSaved(true);
    };
  
    return (
      <div className="flex justify-between items-center z-20">
        <div className="flex gap-2 mr-3">
          <img
            src={`${
              checkIsLiked(likes, userId)
                ? imageNameWithUrl("liked.svg")
                : imageNameWithUrl("like.svg")
            }`}
            alt="like"
            height={20}
            width={20}
            className="cursor-pointer"
            onClick={handleLikePost}
          />
  
          <p className="small-medium lg:base-medium">{likes.length}</p>
        </div>
        <div className="flex gap-2 mr-3">
          {isSavingPost || isDeletingSaved ? (
            <Loader />
          ) : (
            <img
              src={`${
                saved
                  ? imageNameWithUrl("saved.svg")
                  : imageNameWithUrl("save.svg")
              }`}
              alt="share"
              height={20}
              width={20}
              className="cursor-pointer"
              onClick={(e) => handleSavePost(e)}
            />
          )}
        </div>
      </div>
    );
  };
  
  export default PostStats;