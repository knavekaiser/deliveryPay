this.addEventListener("push", (e) => {
  try {
    const body = e.data.json();
    this.registration.showNotification(body.title, body);
  } catch (e) {
    const body = e.data.text();
    this.registration.showNotification(body);
  }
});
