# OPPO Reno2 F (Helio P70) & ColorOS Optimization Guide

The OPPO Reno2 F features high-grade mid-range hardware (MediaTek Helio P70 with 8GB RAM and 128GB UFS storage). However, Android and OPPO's **ColorOS** contain aggressive power-saving governors that must be tuned for reliable server operation.

---

## 1. ColorOS Background Execution Whitelist

ColorOS by default suspends or freezes apps running in background when the screen turns off. To bypass this:

### Step 1: Battery App Management
1. Open **Settings** > **Battery** > **App Battery Management**.
2. Locate and tap **Termux**.
3. Enable **Allow Background Activity**.
4. Enable **Allow Auto-startup**.
5. Enable **Allow Associated Startup** (if present).

### Step 2: Lock App in Memory
1. Open the Android **Recent Apps** switcher (swipe up and hold from the bottom).
2. Look for the Termux card.
3. Tap the **two dots** (or hamburger menu) in the top-right corner of the card.
4. Tap **Lock** (a small padlock icon will appear).
   * This prevents ColorOS from purging Termux when memory pressure occurs.

### Step 3: Disable Doze / Battery Optimization
1. Go to **Settings** > **Battery**.
2. Tap **Power Saving Mode** and ensure it is turned **OFF**.
3. Under **Smart Power Saver**, set to **Off** or exclude Termux.

---

## 2. Termux Wake Lock

Whenever you start the server or reboot the device, run:
```bash
termux-wake-lock
```
This acquires an Android `PARTIAL_WAKE_LOCK`, instructing the Linux kernel to keep CPU clocks active even when the display panel is switched off.

---

## 3. Thermal Management & MediaTek Helio P70

The Helio P70 is fabricated on a 12nm process with an octa-core configuration:
- 4x Cortex-A73 @ 2.1 GHz (Performance cluster)
- 4x Cortex-A53 @ 2.0 GHz (Efficiency cluster)

### Battery Health Tips for 24/7 Hosting:
1. **Remove Phone Cases / Covers**: Silicone or TPU cases trap heat and will cause the Helio P70 to throttle under heavy compilation or load.
2. **Surface Placement**: Place the phone upright on a phone stand or on a hard flat surface (wood/metal) with adequate airflow.
3. **Smart Plug / Battery Preservation**: Keeping a Li-ion battery continuously at 100% state-of-charge with heat can degrade the battery over months. Use a timer or smart plug to charge intermittently, or keep it connected to a standard 5V/1A USB port rather than high-amperage fast chargers.
4. **Dim Display**: Set screen brightness to minimum or screen timeout to 15 seconds.

---

## 4. Static IP Assignment

Android phones by default use DHCP to obtain an IP from your Wi-Fi router, which may change on reboot.

To set a static IP on the OPPO Reno2 F:
1. Open **Settings** > **Wi-Fi**.
2. Tap the `(i)` info icon next to your connected Wi-Fi network.
3. Scroll down to **IP Settings** and change from `DHCP` to `Static`.
4. Assign an address outside your router's normal DHCP pool (e.g., `192.168.1.200`).
