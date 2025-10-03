import { create } from "zustand";

// 스토어에서 관리할 상태의 타입 정의
interface UserState {
  currentUser: any; // 실제 프로젝트에서는 구체적인 유저 타입으로 지정하는 것이 좋습니다.
  isLoggedIn: boolean;
  isLoginPopupOpen: boolean;
  login: (user: any) => void;
  logout: () => void;
  openLoginPopup: () => void;
  closeLoginPopup: () => void;
}

// 스토어 생성
const useUserStore = create<UserState>((set) => ({
  // 초기 상태
  currentUser: null,
  isLoggedIn: false,
  isLoginPopupOpen: false,

  // 상태를 변경하는 액션들
  login: (user) => set({ currentUser: user, isLoggedIn: true }),
  logout: () => set({ currentUser: null, isLoggedIn: false }),
  openLoginPopup: () => set({ isLoginPopupOpen: true }),
  closeLoginPopup: () => set({ isLoginPopupOpen: false }),
}));

export default useUserStore;
