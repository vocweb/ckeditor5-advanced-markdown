// jsdom には ResizeObserver が無いので最小限のスタブを与える
// jsdom không có ResizeObserver nên cung cấp một stub tối thiểu
class ResizeObserverStub {
    public observe() {}
    public unobserve() {}
    public disconnect() {}
}

// scrollToTheSelection が jsdom に無い Range の幾何 API を呼ぶ
// scrollToTheSelection gọi các API hình học của Range mà jsdom không có
const emptyRect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON() {} };

Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
Range.prototype.getBoundingClientRect = () => emptyRect as DOMRect;

window.scrollTo = () => {};

( globalThis as any ).ResizeObserver ??= ResizeObserverStub;
( window as any ).ResizeObserver ??= ResizeObserverStub;
