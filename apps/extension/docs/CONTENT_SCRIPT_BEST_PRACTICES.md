# 📚 Content Script Best Practices Guide

## 🎯 **For Beginners: Why This Matters**

As a new developer, understanding best practices is crucial for writing robust, maintainable code. This guide explains why certain approaches are better than others.

## 🚨 **What NOT to Do (Common Mistakes)**

### **1. Throwing Errors in Content Scripts**

```typescript
// ❌ BAD: Throwing errors
if (restrictedUrl) {
  throw new Error('Cannot access this URL'); // This is bad!
}
```

**Why it's bad:**

- Creates scary error messages in console
- Can crash the entire extension
- Poor user experience
- Not graceful handling

### **2. Using Return at Module Level**

```typescript
// ❌ BAD: Return at module level
if (restrictedUrl) {
  return; // This won't work!
}
```

**Why it's bad:**

- `return` only works inside functions
- Causes syntax errors
- Doesn't actually stop execution

## ✅ **What TO Do (Best Practices)**

### **1. Use IIFE (Immediately Invoked Function Expression)**

```typescript
// ✅ GOOD: IIFE with early return
(function () {
  // Check if we're on an injectable URL
  const currentUrl = window.location.href;
  if (isRestrictedUrl(currentUrl)) {
    console.log('Gracefully exiting - not allowed on this URL');
    return; // This works inside the function!
  }

  // Rest of your content script code...
})();
```

**Why it's good:**

- ✅ Graceful early exit
- ✅ No error messages
- ✅ Clean console logs
- ✅ Extension continues to work normally

### **2. URL Validation Function**

```typescript
// ✅ GOOD: Separate validation function
function isRestrictedUrl(url: string): boolean {
  const restrictedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'edge://',
    'about:',
    'data:',
  ];

  return restrictedPrefixes.some((prefix) => url.startsWith(prefix));
}
```

**Why it's good:**

- ✅ Reusable and maintainable
- ✅ Easy to test
- ✅ Clear intent
- ✅ Easy to extend

### **3. Graceful Error Handling**

```typescript
// ✅ GOOD: Try-catch with graceful handling
try {
  // Attempt to inject content script
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    files: ['contentScript.js'],
  });
} catch (error) {
  // Graceful error handling
  console.log('Content script injection failed:', error.message);
  // Don't throw - just log and continue
}
```

**Why it's good:**

- ✅ No crashes
- ✅ User-friendly experience
- ✅ Proper logging for debugging
- ✅ Extension continues to work

## 🔧 **Complete Best Practice Example**

```typescript
// ✅ BEST PRACTICE: Complete content script
(function () {
  // 1. URL Validation
  const currentUrl = window.location.href;
  if (isRestrictedUrl(currentUrl)) {
    console.log('Weather extension: Not allowed on this URL type');
    return; // Graceful exit
  }

  // 2. State Management
  let overlayVisible = false;
  let overlayElement: HTMLElement | null = null;

  // 3. Helper Functions
  function isRestrictedUrl(url: string): boolean {
    const restrictedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'edge://',
      'about:',
      'data:',
    ];
    return restrictedPrefixes.some((prefix) => url.startsWith(prefix));
  }

  // 4. Error Handling
  function safeExecute(fn: () => void) {
    try {
      fn();
    } catch (error) {
      console.warn('Safe execution failed:', error);
      // Don't throw - just log
    }
  }

  // 5. Cleanup Function
  function cleanup() {
    if (overlayElement) {
      safeExecute(() => overlayElement.remove());
      overlayElement = null;
    }
    overlayVisible = false;
  }

  // 6. Message Listener with Error Handling
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      // Handle message
      if (request === 'TOGGLE_OVERLAY') {
        // Your overlay logic here
        sendResponse({ success: true });
      }
    } catch (error) {
      console.error('Message handling failed:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep message channel open
  });

  // 7. Cleanup on Unload
  window.addEventListener('beforeunload', cleanup);
})();
```

## 📚 **Key Principles for Beginners**

### **1. Graceful Degradation**

- Always handle errors gracefully
- Don't crash the extension
- Provide fallback behavior

### **2. Early Exit Pattern**

- Check conditions early
- Exit gracefully if not allowed
- Don't execute unnecessary code

### **3. Proper Cleanup**

- Always clean up resources
- Remove event listeners
- Clear timers and intervals

### **4. Error Boundaries**

- Wrap risky operations in try-catch
- Log errors for debugging
- Don't let errors propagate

### **5. User Experience First**

- Clear, helpful error messages
- No scary console errors
- Smooth, predictable behavior

## 🎯 **Common Patterns**

### **Pattern 1: Early Validation**

```typescript
(function () {
  // Validate first
  if (!isValidEnvironment()) {
    console.log('Environment not suitable - exiting gracefully');
    return;
  }

  // Main logic here
})();
```

### **Pattern 2: Safe Execution**

```typescript
function safeExecute(operation: () => void) {
  try {
    operation();
  } catch (error) {
    console.warn('Operation failed:', error);
    // Don't throw - just log
  }
}
```

### **Pattern 3: Resource Management**

```typescript
let resources: any[] = [];

function addResource(resource: any) {
  resources.push(resource);
}

function cleanup() {
  resources.forEach((resource) => {
    try {
      resource.cleanup?.();
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });
  resources = [];
}
```

## 🚀 **Benefits of Following Best Practices**

### **For Users:**

- ✅ **No Crashes**: Extension works reliably
- ✅ **Clear Feedback**: Understand what's happening
- ✅ **Smooth Experience**: No scary error messages

### **For Developers:**

- ✅ **Easier Debugging**: Clear logs and error handling
- ✅ **Maintainable Code**: Well-structured and documented
- ✅ **Fewer Bugs**: Proper error boundaries prevent crashes
- ✅ **Better Testing**: Predictable behavior

### **For Extension Store:**

- ✅ **Higher Ratings**: Users have better experience
- ✅ **Fewer Support Issues**: Clear error messages
- ✅ **Better Reviews**: Professional, polished extension

## 🎓 **Learning Path for Beginners**

1. **Start Simple**: Use IIFE pattern for all content scripts
2. **Add Validation**: Check conditions before executing
3. **Handle Errors**: Wrap risky operations in try-catch
4. **Clean Up**: Always clean up resources
5. **Test Thoroughly**: Test on different URL types
6. **Document**: Comment your code for future reference

---

**🎯 Remember:** The goal is to create extensions that work reliably and provide a great user experience. Following these best practices will help you write professional-quality code from the start! 📚✨
