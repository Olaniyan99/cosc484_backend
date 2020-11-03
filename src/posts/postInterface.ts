export interface IPost {
  userID: string;
  author: string;
  text: string;
  comment: [
    {
      userId: string;
      text: string;
    }
  ];
  likes: [
    {
      userId: string;
      like: boolean
    }
  ];
}
