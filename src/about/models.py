from django.db import models

class Review(models.Model):
    customer_name = models.CharField(max_length=100)
    rating = models.IntegerField()  # Rating between 1 and 5
    review_text = models.TextField()

    def __str__(self):
        return f"{self.customer_name} - {self.rating}/5"
