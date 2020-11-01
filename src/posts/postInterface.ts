export interface IPost {
  userID: string;
  author: string;
  text: string;
  comment: [
    {
      userId: string;
      text: string;
      time_post: number;
    }
  ];
  likes: [
    {
      userId: string;
      time_liked: number;
    }
  ];
  date_posted: number;
}
