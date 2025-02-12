import cv2
import easyocr
import re


def get_invader_from_video_path(video_path):
    """
    Extract a list of invaders 'PA_XXXX' from a video file path.
    """
    
    # Initialize EasyOCR reader
    reader = easyocr.Reader(['en'])  

    # Open the video file
    video = cv2.VideoCapture(video_path)
    results_bis = {} # Store the results in a dictionary to count the number of times an invader is detected
    frame_count = 0
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    
    while True:
        ret, frame = video.read()
        if not ret:
            break  # End of video
        
        frame_count += 1
        
        # Skip every other frame
        if frame_count % 4 != 0:
            continue
        if frame_count % 50 == 0:
            print(f"Processing frame {frame_count}/{total_frames}")
        
        # Convert to grayscale for better OCR accuracy
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        processed_frame = cv2.bitwise_not(gray)

        # Run OCR on the frame
        result_by_frame = reader.readtext(processed_frame)
        # print(result_by_frame)

        # Filter results to match "PA_XXX" pattern
        for (_, text, _) in result_by_frame:
            # print(text)
            match = re.search(r'PA_\d+', text)  # Match "PA_XXX"
            if match:
                invader = match.group()
                # print("Detected Text:", invader)
                if invader not in results_bis.keys():
                    results_bis[invader] = 1
                else:
                    if frame_count < 20 or frame_count > total_frames - 30:
                        results_bis[invader] += 4
                    else:
                        results_bis[invader] += 1
    for invader, count in results_bis.items():
        if count <= 11:
            results_bis.pop(invader)

    
    formatted_invaders = [f"PA_{int(invader.split('_')[1]):04d}" for invader in results_bis.keys() if int(invader.split('_')[1]) <= 1500]
    print(formatted_invaders)
    return formatted_invaders


if __name__ == "__main__":
    import time

    video_path = "data/invaders_cropped.MOV"
    time_before = time.time()
    invaders = get_invader_from_video_path(video_path)
    time_after = time.time()
    print("Time taken:", time_after - time_before)
    print(invaders)