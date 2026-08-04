from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Competition, CompetitionParticipant

def competition_list_view(request):
    active_competitions = Competition.objects.filter(status='active').order_by('-start_time')
    upcoming_competitions = Competition.objects.filter(status='upcoming').order_by('start_time')
    finished_competitions = Competition.objects.filter(status='finished').order_by('-end_time')

    context = {
        'active_tab': 'musobaqalar',
        'active_competitions': active_competitions,
        'upcoming_competitions': upcoming_competitions,
        'finished_competitions': finished_competitions,
    }
    return render(request, 'dashboard/competitions.html', context)

def competition_detail_view(request, comp_id):
    competition = get_object_or_404(Competition, pk=comp_id)
    participants = competition.participants.all().order_by('-score', '-wpm')
    
    user_participant = None
    if request.user.is_authenticated:
        user_participant = participants.filter(user=request.user).first()

    context = {
        'active_tab': 'musobaqalar',
        'competition': competition,
        'participants': participants,
        'user_participant': user_participant,
    }
    return render(request, 'projects/competition_detail.html', context)
